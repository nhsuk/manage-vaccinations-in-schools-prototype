import { Gillick } from '../models/gillick.js'
import {
  CaptureOutcome,
  ConsentOutcome,
  PatientOutcome,
  PatientSession,
  ScreenOutcome,
  RegistrationOutcome,
  TriageOutcome
} from '../models/patient-session.js'
import {
  Programme,
  ProgrammeType,
  programmeTypes
} from '../models/programme.js'
import {
  Vaccination,
  VaccinationOutcome,
  VaccinationSite
} from '../models/vaccination.js'
import { today } from '../utils/date.js'

export const patientSessionController = {
  read(request, response, next) {
    const { id, nhsn } = request.params
    const { data } = request.session

    const patientSession = PatientSession.readAll(data)
      .filter(({ session_id }) => session_id === id)
      .find(({ patient }) => patient.nhsn === nhsn)

    // Select first programme in session to show pre-screening questions
    // TODO: Make pre-screening questions pull from all session programmes
    const programme_pid = patientSession.session.programme_pids[0]
    const programme = new Programme(data.programmes[programme_pid], data)
    const fluPid = programmeTypes[ProgrammeType.Flu].pid

    response.locals.options = {
      editGillick:
        patientSession.consent !== ConsentOutcome.Given &&
        patientSession.outcome !== PatientOutcome.Vaccinated,
      showGillick:
        !patientSession.session.programme_pids?.includes(fluPid) &&
        patientSession.session.isActive &&
        patientSession.consent !== ConsentOutcome.Given,
      showReminder: patientSession.consent === ConsentOutcome.NoResponse,
      getReply: Object.values(patientSession.replies).length === 0,
      editReplies:
        patientSession.consent !== ConsentOutcome.Given &&
        patientSession.outcome !== PatientOutcome.Vaccinated,
      editTriage:
        patientSession.triage === TriageOutcome.Completed &&
        patientSession.outcome !== PatientOutcome.Vaccinated,
      showTriage:
        patientSession.consentHealthAnswers &&
        patientSession.triage === TriageOutcome.Needed &&
        patientSession.outcome === PatientOutcome.NoOutcomeYet,
      editRegistration:
        patientSession.consent === ConsentOutcome.Given &&
        patientSession.triage !== TriageOutcome.Needed &&
        patientSession.outcome !== PatientOutcome.Vaccinated,
      showPreScreen:
        patientSession.capture === CaptureOutcome.Vaccinate &&
        patientSession.outcome !== PatientOutcome.Vaccinated &&
        patientSession.outcome !== PatientOutcome.CouldNotVaccinate
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

    response.locals.patientSession = patientSession
    response.locals.patient = patientSession.patient
    response.locals.session = patientSession.session
    response.locals.programme = programme

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

    response.render(`patient-session/${view}`)
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
      // Capture vaccination outcome as absent from session if safe to vaccinate
      const programme = Programme.read(session.programme_pids[0], data)
      const absentVaccination = new Vaccination({
        location: session.location.name,
        school_urn: session.school_urn,
        outcome: VaccinationOutcome.AbsentSession,
        patient_uuid: patient.uuid,
        programme_pid: programme.pid,
        session_id: session.id,
        vaccine_gtin: programme.vaccine.gtin,
        ...(data.token && { createdBy_uid: data.token?.uid })
      })

      // Update vaccination record
      absentVaccination.update(absentVaccination, data)
    }

    // Clean up session data
    delete data.patientSession?.registration

    request.flash(
      'message',
      __(`patientSession.registration.success.${patientSession.capture}`, {
        patient,
        session
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
        info_: gillick,
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
    const { __, back, patient, patientSession, session } = response.locals

    patientSession.recordTriage({
      info_: triage.outcome,
      name:
        triage.outcome === ScreenOutcome.NeedsTriage
          ? 'Triaged decision: Keep in triage'
          : `Triaged decision: ${triage.outcome}`,
      note: triage.note,
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    // Clean up session data
    delete data.triage

    request.flash('success', __(`triage.edit.success`, { patient, session }))

    response.redirect(back)
  }
}
