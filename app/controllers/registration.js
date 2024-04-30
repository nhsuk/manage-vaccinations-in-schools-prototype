import { Patient } from '../models/patient.js'
import { Registration } from '../models/registration.js'

export const registrationController = {
  edit(request, response) {
    const { nhsn } = request.params
    const { data } = request.session

    const patient = new Patient(data.patients[nhsn])

    // Convert string to boolean
    switch (true) {
      case patient.registered === true:
        response.locals.patient.registered = 'true'
        break
      case patient.registered === false:
        response.locals.patient.registered = 'false'
        break
      default:
        response.locals.patient.registered = 'undefined'
    }

    response.render('registration/edit')
  },

  update(request, response) {
    const { id, nhsn } = request.params
    const { tab } = request.query
    const { data } = request.session
    const { __, patient, session } = response.locals

    // Convert boolean to string
    let registered
    let key
    switch (true) {
      case data.patient.registered === 'true':
        registered = true
        key = 'Present'
        break
      case data.patient.registered === 'false':
        registered = false
        key = 'Absent'
        break
      default:
        registered = undefined
        key = 'Pending'
    }

    patient.register = new Registration({
      name: __(`registration.${key}.name`, { location: session.location }),
      registered,
      ...(data.token && { created_user_uuid: data.token.uuid })
    })
    data.patients[nhsn] = patient

    const captureKey = patient.capture.key

    request.flash(
      'message',
      __(`registration.update.success.${captureKey}`, { patient })
    )

    if (tab) {
      response.redirect(`/sessions/${id}/capture?tab=${tab}`)
    } else {
      response.redirect(patient.uri)
    }
  }
}
