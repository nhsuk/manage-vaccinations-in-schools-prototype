import { Patient } from '../models/patient.js'

export const triageController = {
  update(request, response) {
    const { activity, session } = request.app.locals
    const { form, id } = request.params
    const { data } = request.session
    const { __, patient } = response.locals

    const updatedPatient = new Patient(patient)
    updatedPatient.recordTriage({
      ...data.triage,
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    data.patients[patient.uuid] = updatedPatient

    delete data.triage

    const action = form === 'edit' ? 'update' : 'create'
    request.flash(
      'success',
      __(`triage.success.${action}`, { patient: updatedPatient })
    )

    if (session.isActive) {
      response.redirect(updatedPatient.uriInSession)
    } else {
      response.redirect(`/sessions/${id}/${activity || 'triage'}`)
    }
  },

  readForm(request, response, next) {
    const { patient } = response.locals

    response.locals.paths = {
      back: `${patient.uriInSession}`,
      next: `${patient.uriInSession}/triage/new`
    }

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`triage/form/${view}`)
  }
}
