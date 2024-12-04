import { Gillick } from '../models/gillick.js'
import { Patient } from '../models/patient.js'

export const gillickController = {
  read(request, response, next) {
    const { patient } = response.locals

    request.app.locals.gillick = new Gillick(patient.gillick)

    next()
  },

  show(request, response) {
    const { form } = request.params

    response.render('gillick/form', { form })
  },

  update(request, response) {
    const { form } = request.params
    const { data } = request.session
    const { __, patient } = response.locals

    const updatedPatient = new Patient(patient)
    updatedPatient.assessGillick({
      ...request.body.gillick,
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    data.patients[patient.uuid] = updatedPatient

    delete data.gillick

    const action = form === 'edit' ? 'update' : 'create'
    request.flash('success', __(`gillick.success.${action}`))

    response.redirect(updatedPatient.uriInSession)
  }
}
