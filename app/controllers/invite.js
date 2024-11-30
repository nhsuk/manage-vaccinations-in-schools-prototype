import { Session, SessionStatus } from '../models/session.js'

export const inviteController = {
  read(request, response, next) {
    const { data } = request.session
    const { patient } = response.locals

    response.locals.paths = {
      back: patient.uri,
      next: patient.uri
    }

    response.locals.sessionIdItems = Object.values(data.sessions)
      .map((session) => new Session(session, data))
      .filter((session) => session.status !== SessionStatus.Completed)
      .sort(
        (a, b) =>
          new Date(a.dates[0]).valueOf() - new Date(b.dates[0]).valueOf()
      )
      .map((session) => ({
        text: session.location.name,
        hint: { text: session.formatted.date },
        value: session.id
      }))

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`invite/${view}`)
  },

  update(request, response) {
    const { data } = request.session
    const { patient } = response.locals
    const { __, paths } = response.locals

    const { session_id } = data.patient

    const session = new Session(data.sessions[session_id], data)

    // Invite patient to session
    patient.invite = session

    // Update patient record
    data.patients[patient.uuid] = patient

    // Delete patient session data
    delete data.patient

    request.flash('success', __(`patient.success.invite`, { session }))

    response.redirect(paths.next)
  }
}
