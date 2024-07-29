import { Campaign } from '../models/campaign.js'
import { Event } from '../models/event.js'
import {
  CaptureOutcome,
  ConsentOutcome,
  Patient,
  PatientOutcome,
  TriageOutcome
} from '../models/patient.js'
import { Reply } from '../models/reply.js'
import { Session, SessionStatus } from '../models/session.js'
import { Vaccination } from '../models/vaccination.js'

export const patientController = {
  read(request, response, next) {
    const { id, nhsn } = request.params
    const { data } = request.session

    const patient = new Patient(data.patients[nhsn])
    const replies = Object.values(patient.replies)
    const session = new Session(data.sessions[id])
    const campaign = new Campaign(data.campaigns[session.campaign_uuid])

    response.locals.patient = patient
    response.locals.replies = replies.map((reply) => new Reply(reply))
    response.locals.session = session
    response.locals.campaign = campaign
    response.locals.vaccinations = Object.keys(patient.vaccinations).map(
      (uuid) => new Vaccination(data.vaccinations[uuid])
    )

    next()
  },

  show(request, response) {
    const { activity } = request.app.locals
    const { campaign, patient, session, preScreenQuestions } = response.locals

    const options = {
      editGillick:
        patient.consent?.value !== ConsentOutcome.Given &&
        patient.outcome?.value !== PatientOutcome.Vaccinated,
      showGillick:
        campaign.type !== 'flu' &&
        session.status === SessionStatus.Active &&
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

    response.render('patient/show', {
      activity:
        activity || session.status !== SessionStatus.Active
          ? 'consent'
          : 'capture',
      options,
      preScreenQuestions
    })
  },

  events(request, response) {
    const { activity } = request.app.locals
    const { session } = response.locals

    response.render('patient/events', {
      activity:
        activity || session.status !== SessionStatus.Active
          ? 'consent'
          : 'capture'
    })
  }
}
