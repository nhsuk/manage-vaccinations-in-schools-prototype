import { Gillick } from '../models/gillick.js'
import {
  ConsentOutcome,
  PatientOutcome,
  PatientSession,
  ScreenOutcome,
  RegistrationOutcome,
  TriageOutcome
} from '../models/patient-session.js'
import { Programme, ProgrammeType } from '../models/programme.js'
import { ConsentWindow } from '../models/session.js'
import {
  Vaccination,
  VaccinationOutcome,
  VaccinationSite
} from '../models/vaccination.js'
import { today } from '../utils/date.js'
import { formatNavigationItemWithSecondaryText } from '../utils/string.js'

export const patientSessionController = {
  read(request, response, next) {
    const { pid, nhsn } = request.params
    const { activity } = request.query
    const { data } = request.session
    const { __, __n } = response.locals

    const patientSession = PatientSession.readAll(data)
      .filter(({ programme_pid }) => programme_pid === pid)
      .find(({ patient }) => patient.nhsn === nhsn)

    const { patient, session, programme } = patientSession
    const { consent, screen, triage, registration, outcome } = patientSession

    response.locals.options = {
      // Invite to session
      canInvite: consent === ConsentOutcome.NoRequest,
      // Send a reminder to give consent
      canRemind:
        session.consentWindow === ConsentWindow.Open &&
        !session.isActive &&
        consent === ConsentOutcome.NoResponse,
      // Get verbal consent
      canRespond:
        session.consentWindow === ConsentWindow.Open &&
        ![ConsentOutcome.Given].includes(consent),
      // Perform Gillick assessment
      canGillick:
        programme.type !== ProgrammeType.Flu &&
        session.isActive &&
        consent !== ConsentOutcome.Given,
      // Patient requires triage
      canTriage: triage !== TriageOutcome.NotNeeded,
      // Patient already triaged
      hasTriage: patient.triageNotes.length > 0,
      editRegistration:
        consent === ConsentOutcome.Given &&
        triage !== TriageOutcome.Needed &&
        outcome !== PatientOutcome.Vaccinated,
      canRecord:
        session.isActive &&
        registration === RegistrationOutcome.Present &&
        triage !== TriageOutcome.Needed &&
        screen !== ScreenOutcome.DoNotVaccinate &&
        outcome !== PatientOutcome.Vaccinated,
      canOutcome:
        outcome !== PatientOutcome.NoOutcomeYet &&
        patientSession.lastRecordedVaccination
    }

    response.locals.injectionSiteItems = Object.entries(VaccinationSite)
      .filter(([, value]) =>
        [
          VaccinationSite.ArmLeftUpper,
          VaccinationSite.ArmRightUpper,
          VaccinationSite.Other
        ].includes(value)
      )
      .map(([key, value]) => ({
        text: VaccinationSite[key],
        value
      }))

    const view = request.path.split('/').at(-1)
    response.locals.navigationItems = [
      ...patientSession.siblingPatientSessions.map((patientSession) => ({
        text: formatNavigationItemWithSecondaryText(
          patientSession.programme.name,
          patientSession.nextActivity
        ),
        href: `${patientSession.uri}?activity=${activity}`,
        current: view !== 'events' && patientSession.programme_pid === pid
      })),
      ...[
        {
          text: formatNavigationItemWithSecondaryText(
            __('patientSession.events.title'),
            String(
              __n(
                'patientSession.events.count',
                patientSession.auditEvents.length
              )
            )
          ),
          href: `${patientSession.uri}/events?activity=${activity}`,
          current: view === 'events'
        }
      ]
    ]

    response.locals.activity = activity
    response.locals.referrer = activity
      ? `${patientSession.uri}?activity=${activity}`
      : patientSession.uri
    response.locals.patientSession = patientSession
    response.locals.patient = patient
    response.locals.session = session

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`patient-session/${view}`)
  },

  readForm(request, response, next) {
    const { form } = request.params
    const { referrer } = request.session
    const { patientSession } = response.locals

    // Show back link to referring page, else patient session page
    response.locals.back = referrer || patientSession.uri
    response.locals.form = form

    next()
  },

  showForm(request, response) {
    const view = request.params.view || 'show'

    response.render(`patient-session/form/${view}`)
  },

  register(request, response) {
    const { registration } = request.body.patientSession
    const { data } = request.session
    const { __, patient, patientSession, session, back } = response.locals

    patientSession.registerAttendance(
      {
        ...(data.token && { createdBy_uid: data.token?.uid })
      },
      registration
    )

    if (
      registration === RegistrationOutcome.Absent &&
      patientSession.outcome !== PatientOutcome.CouldNotVaccinate
    ) {
      // Record vaccination outcome as absent from session if safe to vaccinate
      const programme = Programme.read(session.programme_pids[0], data)
      const vaccination = new Vaccination({
        location: session.location.name,
        school_urn: session.school_urn,
        outcome: VaccinationOutcome.AbsentSession,
        patient_uuid: patient.uuid,
        programme_pid: programme.pid,
        session_id: session.id,
        vaccine_gtin: programme.vaccine.gtin,
        ...(data.token && { createdBy_uid: data.token?.uid })
      })
      vaccination.update(vaccination, data)
      patient.recordVaccination(vaccination)
    }

    // Clean up session data
    delete data.patientSession?.registration

    request.flash(
      'message',
      __(`patientSession.registration.success.${patientSession.nextActivity}`, {
        patientSession
      })
    )

    response.redirect(back)
  },

  gillick(request, response) {
    const { gillick } = request.body.patientSession
    const { data } = request.session
    const { __, back, form, patientSession } = response.locals

    if (form === 'edit') {
      gillick.updatedAt = today()
    }

    patientSession.assessGillick(
      {
        ...(data.token && { createdBy_uid: data.token?.uid })
      },
      new Gillick(gillick)
    )

    // Clean up session data
    delete data.patientSession?.gillick

    request.flash('success', __(`patientSession.gillick.${form}.success`))

    response.redirect(back)
  },

  preScreen(request, response) {
    const { preScreen } = request.body.patientSession
    const { data } = request.session
    const { back, patientSession, programme } = response.locals

    // Pre-screen interview
    patientSession.preScreen({
      note: preScreen.note,
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    response.redirect(
      `${programme.uri}/vaccinations/new?patientSession_uuid=${patientSession.uuid}&referrer=${back}`
    )
  },

  invite(request, response) {
    const { data } = request.session
    const { __, back, patient, patientSession } = response.locals

    patient.inviteToSession({
      patientSession,
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    request.flash(
      'success',
      __('patientSession.invite.success', { parent: patient.parent1 })
    )

    response.redirect(back)
  },

  remind(request, response) {
    const { data } = request.session
    const { back, patient, patientSession } = response.locals

    patientSession.sendReminder(
      {
        ...(data.token && { createdBy_uid: data.token?.uid })
      },
      patient.parent1
    )

    response.redirect(back)
  },

  triage(request, response) {
    const { triage } = request.body
    const { data } = request.session
    const { __, back, patientSession } = response.locals

    patientSession.recordTriage({
      outcome: triage.outcome,
      name:
        triage.outcome === ScreenOutcome.NeedsTriage
          ? 'Triaged decision: Keep in triage'
          : `Triaged decision: ${triage.outcome}`,
      note: triage.note,
      createdBy_uid: data.token?.uid || '000123456789'
    })

    // Clean up session data
    delete data.triage

    request.flash('success', __(`triage.edit.success`, { patientSession }))

    response.redirect(back)
  }
}
