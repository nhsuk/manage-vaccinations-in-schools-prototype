import { Session } from '../models/session.js'
import { getSessionPatientPath } from '../utils/session.js'

export const inviteController = {
  update(request, response) {
    const { data } = request.session
    const { __, patient } = response.locals

    const parent = patient.parent1

    const session = new Session(
      {
        ...response.locals.session,
        ...(data.token && { createdBy_uid: data.token?.uid })
      },
      data
    )

    patient.inviteToSession(session)

    request.flash('success', __('invite.success', { parent }))
    response.redirect(getSessionPatientPath(session, patient))
  }
}
