import { getSessionPatientPath } from '../utils/session.js'

export const remindController = {
  read(request, response, next) {
    const { patient, session } = response.locals

    response.locals.paths = {
      next: getSessionPatientPath(session, patient)
    }

    next()
  },

  update(request, response) {
    const { data } = request.session
    const { paths, patient } = response.locals

    patient.sendReminder({
      fullName: patient.parent1.fullName,
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    response.redirect(paths.next)
  }
}
