import {
  Programme,
  ProgrammeType,
  programmeTypes
} from '../models/programme.js'
import {
  CaptureOutcome,
  ConsentOutcome,
  Patient,
  PatientOutcome,
  TriageOutcome
} from '../models/patient.js'
import { Record } from '../models/record.js'
import { Reply } from '../models/reply.js'
import { Session, SessionStatus } from '../models/session.js'
import { Vaccination } from '../models/vaccination.js'

export const patientController = {
  read(request, response, next) {
    const { id, nhsn } = request.params
    const { data } = request.session

    let patient = Object.values(data.patients).find(
      (patient) => patient.record.nhsn === nhsn
    )

    // If no patient found, locate record (patient not added to a cohort yet)
    if (!patient) {
      const record = Object.values(data.records).find(
        (record) => record.nhsn === nhsn
      )
      patient = new Patient({ record })
    }

    const replies = Object.values(patient.replies)
    const vaccinations = Object.keys(patient.vaccinations)
      .map((uuid) => new Vaccination(data.vaccinations[uuid]))
      .filter((vaccination) => vaccination.session_id === id)

    response.locals.patient = new Patient(patient)
    response.locals.replies = replies.map((reply) => new Reply(reply))
    response.locals.vaccinations = vaccinations

    // Patient in session
    if (request.originalUrl.includes('sessions')) {
      const session = new Session(data.sessions[id])

      // Select first programme in session to show pre-screening questions
      // TODO: Make pre-screening questions pull from all session programmes
      const programme_pid = session.programmes[0]
      const programme = new Programme(data.programmes[programme_pid])

      response.locals.programme = programme
      response.locals.session = session
    }

    next()
  },

  show(request, response) {
    const { activity } = request.app.locals
    const view = request.params.view || 'show'
    const { patient, session } = response.locals
    const fluPid = programmeTypes[ProgrammeType.Flu].pid

    response.locals.options = {
      editGillick:
        patient.consent?.value !== ConsentOutcome.Given &&
        patient.outcome?.value !== PatientOutcome.Vaccinated,
      showGillick:
        !session.programmes?.includes(fluPid) &&
        session?.status === SessionStatus.Active &&
        patient.consent?.value !== ConsentOutcome.Given,
      editReplies:
        patient.consent?.value !== ConsentOutcome.Given &&
        patient.outcome?.value !== PatientOutcome.Vaccinated,
      editTriage:
        patient.triage?.value === TriageOutcome.Completed &&
        patient.outcome?.value !== PatientOutcome.Vaccinated,
      showTriage:
        patient.consentHealthAnswers &&
        patient.triage?.value === TriageOutcome.Needed &&
        patient.outcome?.value === PatientOutcome.NoOutcomeYet,
      editRegistration:
        patient.consent?.value === ConsentOutcome.Given &&
        patient.triage?.value !== TriageOutcome.Needed &&
        patient.outcome?.value !== PatientOutcome.Vaccinated,
      showPreScreen:
        patient.capture?.value === CaptureOutcome.Vaccinate &&
        patient.outcome?.value !== PatientOutcome.Vaccinated &&
        patient.outcome?.value !== PatientOutcome.CouldNotVaccinate
    }

    response.locals.activity =
      activity || session?.status !== SessionStatus.Active
        ? 'consent'
        : 'capture'

    response.render(`patient/${view}`)
  },

  readForm(request, response, next) {
    const { patient } = response.locals

    response.locals.paths = {
      back: patient.uri,
      next: patient.uri
    }

    next()
  },

  showForm(request, response) {
    const { form, view } = request.params

    response.render(`patient/form/${view}`, { form })
  },

  updateForm(request, response) {
    const { data } = request.session
    const { uid, uuid } = request.params
    const { __, patient } = response.locals

    const updatedRecord = new Record(
      Object.assign(
        patient.record, // Previous record values
        request.body.patient.record // New record values
      )
    )

    const updatedPatient = new Patient(
      Object.assign(patient, { record: updatedRecord })
    )

    data.patients[updatedPatient.uuid] = updatedPatient

    request.flash('success', __('patient.success.update'))

    let redirect
    if (uid && uuid) {
      // Return to programme vaccinations list
      redirect = `/programmes/${uid}/vaccinations/${uuid}`
    } else {
      redirect = updatedPatient.uri
    }

    response.redirect(redirect)
  }
}
