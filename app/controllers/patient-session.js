import { Gillick } from '../models/gillick.js'
import {
  Activity,
  ConsentOutcome,
  PatientOutcome,
  PatientSession,
  ScreenOutcome,
  TriageOutcome
} from '../models/patient-session.js'
import { Programme, ProgrammeType } from '../models/programme.js'
import { ConsentWindow, RegistrationOutcome } from '../models/session.js'
import {
  Vaccination,
  VaccinationOutcome,
  VaccinationSite
} from '../models/vaccination.js'
import { PreScreenQuestion, VaccineMethod } from '../models/vaccine.js'
import { today } from '../utils/date.js'

export const patientSessionController = {
  read(request, response, next, nhsn) {
    const { programme_id } = request.params
    const { activity } = request.query
    const { __ } = response.locals

    const patientSession = PatientSession.readAll(request.session.data)
      .filter(({ programme }) => programme.id === programme_id)
      .find(({ patient }) => patient.nhsn === nhsn)

    const {
      consent,
      nextActivity,
      patient,
      programme,
      register,
      report,
      session,
      triage,
      triageNotes,
      vaccine
    } = patientSession

    const outcomed = patientSession.siblingPatientSessions.filter(
      ({ outcome }) => outcome !== PatientOutcome.NoOutcomeYet
    )

    const notOutcomed = patientSession.siblingPatientSessions.filter(
      ({ outcome }) => outcome === PatientOutcome.NoOutcomeYet
    )

    response.locals.options = {
      // Show outstanding vaccinations
      showOutstandingVaccinations:
        outcomed.length > 0 && notOutcomed.length > 0,
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
      hasTriage: triageNotes.length > 0,
      canRecord:
        register === RegistrationOutcome.Present &&
        nextActivity === Activity.Record,
      canReport:
        report !== PatientOutcome.NoOutcomeYet &&
        patientSession.lastRecordedVaccination
    }

    if (vaccine?.method === VaccineMethod.Injection) {
      response.locals.vaccinationSiteItems = Object.entries(VaccinationSite)
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
    }

    const view = request.path.split('/').at(-1)
    response.locals.navigationItems = [
      ...patientSession.siblingPatientSessions.map((patientSession) => ({
        ...(patientSession.report === PatientOutcome.Vaccinated && {
          icon: { icon: 'tick' }
        }),
        text: patientSession.programme.name,
        href: activity
          ? `${patientSession.uri}?activity=${activity}`
          : patientSession.uri,
        current:
          view !== 'events' && patientSession.programme_id === programme_id
      })),
      ...[
        {
          text: __('patientSession.events.title'),
          href: activity
            ? `${patientSession.uri}/events?activity=${activity}`
            : `${patientSession.uri}/events`,
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
    response.locals.programme = programme
    response.locals.session = session

    // Use different values for pre-screening questions
    // `IsWell` and `IsPregnant` should persist per patient
    response.locals.preScreenQuestionItems = Object.entries(
      vaccine.preScreenQuestions
    ).map(([key, text]) => {
      let value = `${programme.id}-${key}`
      if (text === PreScreenQuestion.IsWell) {
        value = `${nhsn}-is-well`
      } else if (text === PreScreenQuestion.IsPregnant) {
        value = `${nhsn}-is-pregnant`
      }

      return { text, value }
    })

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`patient-session/${view}`)
  },

  readForm(request, response, next) {
    const { referrer } = request.session
    const { patientSession } = response.locals

    // Show back link to referring page, else patient session page
    response.locals.back = referrer || patientSession.uri

    next()
  },

  showForm(type) {
    return (request, response) => {
      const { view } = request.params

      response.render(`patient-session/form/${view}`, { type })
    }
  },

  register(request, response) {
    const { register } = request.body.patientSession
    const { data } = request.session
    const { __, patient, patientSession, session, back } = response.locals

    patientSession.registerAttendance(
      {
        ...(data.token && { createdBy_uid: data.token?.uid })
      },
      register
    )

    if (
      register === RegistrationOutcome.Absent &&
      patientSession.report !== PatientOutcome.CouldNotVaccinate
    ) {
      // Record vaccination outcome as absent if safe to vaccinate
      const programme = Programme.read(session.programme_ids[0], data)
      const vaccination = new Vaccination({
        location: session.location.name,
        school_urn: session.school_urn,
        outcome: VaccinationOutcome.Absent,
        patient_uuid: patient.uuid,
        programme_id: programme.id,
        session_id: session.id,
        vaccine_snomed: patientSession.vaccine.snomed,
        ...(data.token && { createdBy_uid: data.token?.uid })
      })
      vaccination.update(vaccination, data)
      patient.recordVaccination(vaccination)
    }

    // Clean up session data
    delete data.patientSession?.register

    request.flash(
      'message',
      __(`patientSession.registration.success.${patientSession.register}`, {
        patientSession
      })
    )

    response.redirect(back)
  },

  gillick(type) {
    return (request, response) => {
      const { gillick } = request.body.patientSession
      const { data } = request.session
      const { __, back, patientSession } = response.locals

      if (type === 'edit') {
        gillick.updatedAt = today()
      }

      const name = __(`patientSession.gillick.${type}.success`)
      request.flash('success', name)

      patientSession.assessGillick(
        {
          name,
          ...(data.token && { createdBy_uid: data.token?.uid })
        },
        new Gillick(gillick)
      )

      // Clean up session data
      delete data.patientSession?.gillick

      response.redirect(back)
    }
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

  vaccination(request, response) {
    const { data } = request.session
    const { patient, patientSession, session, programme } = response.locals

    // Vaccination
    const vaccination = new Vaccination({
      outcome: VaccinationOutcome.AlreadyVaccinated,
      patient_uuid: patient.uuid,
      programme_id: programme.id,
      session_id: session.id,
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    vaccination.create(vaccination, data.wizard)
    patient.recordVaccination(vaccination)

    response.redirect(
      `${programme.uri}/vaccinations/${vaccination.uuid}/new/check-answers?referrer=${patientSession.uri}`
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
