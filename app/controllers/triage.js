import { Patient } from '../models/patient.js'
import { SessionStatus } from '../models/session.js'

export const triageController = {
  update(request, response) {
    const { activity, session } = request.app.locals
    const { form, id, nhsn } = request.params
    const { data } = request.session
    const { __ } = response.locals
    const patient = new Patient(response.locals.patient)

    data.patients[nhsn] = patient
    data.patients[nhsn].triage = {
      ...data.triage,
      ...(data.token && { created_user_uuid: data.token.uuid })
    }

    delete data.triage

    const action = form === 'edit' ? 'update' : 'create'
    request.flash('success', __(`triage.success.${action}`, { patient }))

    if (session.status === SessionStatus.Active) {
      response.redirect(patient.uri)
    } else {
      response.redirect(`/sessions/${id}/${activity || 'triage'}`)
    }
  }
}
