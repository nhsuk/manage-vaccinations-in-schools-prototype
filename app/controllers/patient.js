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

    // If no patient found, use CHIS record (patient not imported yet)
    if (!patient) {
      const record = Object.values(data.records).find(
        (record) => record.nhsn === nhsn
      )
      patient = { record }
    }

    patient = new Patient(patient)

    const replies = Object.values(patient.replies)
    const vaccinations = Object.keys(patient.vaccinations)
      .map((uuid) => new Vaccination(data.vaccinations[uuid]))
      .filter((vaccination) => vaccination.session_id === id)

    request.app.locals.record = patient.record
    response.locals.patient = patient
    response.locals.replies = replies.map((reply) => new Reply(reply))
    response.locals.vaccinations = vaccinations

    // Patient in session
    if (request.originalUrl.includes('sessions')) {
      const session = new Session(data.sessions[id])

      // Select first programme in session to show pre-screening questions
      // TODO: Make pre-screening questions pull from all session programmes
      const programme_pid = session.programmes[0]
      const programme = new Programme(data.programmes[programme_pid])
      const fluPid = programmeTypes[ProgrammeType.Flu].pid

      response.locals.options = {
        editGillick:
          patient.consent?.value !== ConsentOutcome.Given &&
          patient.outcome?.value !== PatientOutcome.Vaccinated,
        showGillick:
          !session.programmes?.includes(fluPid) &&
          session.active &&
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

      response.locals.programme = programme
      response.locals.session = session
    }

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`patient/${view}`)
  },

  edit(request, response) {
    const { back, record } = request.app.locals
    const { referrer } = request.query
    const { data } = request.session
    const { patient } = response.locals

    request.app.locals.back = referrer || back || patient.uri
    request.app.locals.record = new Record({
      ...record, // Previous values
      ...data?.wizard?.record // Wizard values
    })

    response.render('patient/edit')
  },

  update(request, response) {
    const { back, record } = request.app.locals
    const { data } = request.session
    const { __, patient } = response.locals

    const updatedRecord = new Record(
      Object.assign(
        record, // Previous values
        data?.wizard?.record, // Wizard values
        request.body.record // New values
      )
    )

    const updatedPatient = new Patient(
      Object.assign(patient, { record: updatedRecord })
    )

    data.patients[updatedPatient.uuid] = updatedPatient

    // Clean up
    delete data?.wizard?.record
    delete request.app.locals.back
    delete request.app.locals.record

    request.flash('success', __('patient.success.update'))

    const redirect = back || updatedPatient.uri
    response.redirect(redirect)
  },

  readForm(request, response, next) {
    const { back, record } = request.app.locals
    const { form } = request.params
    const { referrer } = request.query
    const { data } = request.session
    const { patient } = response.locals

    request.app.locals.referrer = referrer || back
    request.app.locals.record = new Record({
      ...record,
      ...(form === 'edit' && record), // Previous values
      ...data?.wizard?.record // Wizard values
    })

    response.locals.paths = {
      ...(form === 'edit' && {
        back: `${patient.uri}/edit`,
        next: `${patient.uri}/edit`
      })
    }

    next()
  },

  showForm(request, response) {
    let { form, view } = request.params

    // Edit each parent using the same view
    if (view.includes('parent')) {
      response.locals.parentId = view.split('-')[1]
      view = 'parent'
    }

    response.render(`patient/form/${view}`, { form })
  },

  updateForm(request, response) {
    const { record } = request.app.locals
    const { data } = request.session
    const { paths } = response.locals

    data.wizard.record = new Record(
      Object.assign(
        record, // Previous values
        request.body.record // New value
      )
    )

    response.redirect(paths.next)
  }
}
