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

    response.render(`patient/gillick`, { form })
  },

  update(request, response) {
    const { form, id, nhsn } = request.params
    const { data } = request.session
    const { __, patient } = response.locals

    data.patients[nhsn] = new Patient(patient)

    data.patients[nhsn].assess = new Gillick({
      ...request.body.gillick,
      ...(data.token && { created_user_uuid: data.token.uuid })
    })

    delete data.gillick

    const action = form === 'edit' ? 'update' : 'create'
    request.flash('success', __(`gillick.success.${action}`))

    response.redirect(`/sessions/${id}/${nhsn}`)
  }
}
