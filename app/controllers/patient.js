import { Event } from '../models/event.js'
import { Patient } from '../models/patient.js'
import { Reply } from '../models/reply.js'
import { Session } from '../models/session.js'

export const patientController = {
  read(request, response, next) {
    const { id, nhsn } = request.params
    const { data } = request.session

    const patient = new Patient(data.patients[nhsn])
    const replies = Object.values(patient.replies)
    const session = new Session(data.sessions[id])

    response.locals.patient = patient
    response.locals.replies = replies.map((reply) => new Reply(reply))
    response.locals.session = session

    next()
  },

  show(request, response) {
    const { activity } = request.app.locals
    const { session } = response.locals

    response.render('patient/show', {
      activity,
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
