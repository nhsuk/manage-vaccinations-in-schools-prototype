import { Gillick } from '../models/gillick.js'
import { Patient } from '../models/patient.js'
import { getSessionPatientPath } from '../utils/session.js'

export const gillickController = {
  read(request, response, next) {
    const { patient, session } = response.locals

    request.app.locals.gillick = new Gillick(patient.gillick)

    response.locals.paths = {
      back: getSessionPatientPath(session, patient),
      next: getSessionPatientPath(session, patient)
    }

    next()
  },

  show(request, response) {
    const { form } = request.params

    response.render('gillick/form', { form })
  },

  update(request, response) {
    const { form } = request.params
    const { data } = request.session
    const { __, paths, patient } = response.locals

    const updatedPatient = new Patient(patient)
    updatedPatient.assessGillick({
      ...request.body.gillick,
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    data.patients[patient.uuid] = updatedPatient

    delete data.gillick

    request.flash('success', __(`gillick.${form}.success`))

    response.redirect(paths.next)
  }
}
