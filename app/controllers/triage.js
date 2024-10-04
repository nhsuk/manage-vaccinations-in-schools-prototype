import { Patient } from '../models/patient.js'
import { SessionStatus } from '../models/session.js'

export const triageController = {
  update(request, response) {
    const { activity, session } = request.app.locals
    const { form, id } = request.params
    const { data } = request.session
    const { __, patient } = response.locals

    data.patients[patient.uuid] = new Patient(patient)
    data.patients[patient.uuid].triage = {
      ...data.triage,
      ...(data.token && { created_user_uid: data.token?.uid })
    }

    delete data.triage

    const action = form === 'edit' ? 'update' : 'create'
    request.flash('success', __(`triage.success.${action}`, { patient }))

    if (session.isActive) {
      response.redirect(patient.uri)
    } else {
      response.redirect(`/sessions/${id}/${activity || 'triage'}`)
    }
  },

  readForm(request, response, next) {
    const { patient } = response.locals

    response.locals.paths = {
      back: `${patient.uri}`,
      next: `${patient.uri}/triage/new`
    }

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`triage/form/${view}`)
  }
}
