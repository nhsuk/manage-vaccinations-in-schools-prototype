import { Patient } from '../models/patient.js'
import { getSessionPatientPath } from '../utils/session.js'

export const triageController = {
  update(request, response) {
    const { activity, session } = request.app.locals
    const { id } = request.params
    const { data } = request.session
    const { __, patient } = response.locals

    const updatedPatient = new Patient(patient)
    updatedPatient.recordTriage({
      ...data.triage,
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    data.patients[patient.uuid] = updatedPatient

    delete data.triage

    request.flash(
      'success',
      __(`triage.edit.success`, { patient: updatedPatient, session })
    )

    if (session.isActive) {
      response.redirect(getSessionPatientPath(session, updatedPatient))
    } else {
      response.redirect(`/sessions/${id}/${activity || 'triage'}`)
    }
  },

  readForm(request, response, next) {
    const { patient, session } = response.locals

    response.locals.paths = {
      back: getSessionPatientPath(session, patient),
      next: getSessionPatientPath(session, patient, 'triage/new')
    }

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`triage/form/${view}`)
  }
}
