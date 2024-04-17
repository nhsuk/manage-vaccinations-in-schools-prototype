import { Campaign } from '../models/campaign.js'
import { Event } from '../models/event.js'
import {
  ConsentOutcome,
  Patient,
  PatientOutcome,
  TriageOutcome
} from '../models/patient.js'
import { Reply } from '../models/reply.js'
import { Session, SessionStatus } from '../models/session.js'

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

    next()
  },

  show(request, response) {
    const { activity } = request.app.locals
    const { campaign, patient, session } = response.locals

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
        patient.outcome?.value !== PatientOutcome.Vaccinated
    }

    response.render('patient/show', {
      activity,
      options,
      paths: { back: `${session.uri}/${activity}` }
    })
  },

  events(request, response) {
    const { activity } = request.app.locals
    const { data } = request.session
    const { patient, session } = response.locals

    response.render('patient/events', {
      activity,
      events: Object.values(patient.events)
        .map((event) => ({
          ...new Event(event),
          ...{ formattedDate: new Event(event).formattedDate },
          ...{ formattedDateTime: new Event(event).formattedDateTime }
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
      paths: { back: `${session.uri}/${activity}` }
    })
  }
}
