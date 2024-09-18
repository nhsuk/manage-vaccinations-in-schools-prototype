import { PatientOutcome } from '../models/patient.js'
import { Registration } from '../models/registration.js'
import { Vaccination, VaccinationOutcome } from '../models/vaccination.js'

export const registrationController = {
  read(request, response, next) {
    const { patient } = response.locals

    // Convert string to boolean
    switch (true) {
      case patient.registered === true:
        response.locals.patient.registered = true
        break
      case patient.registered === false:
        response.locals.patient.registered = false
        break
      default:
        response.locals.patient.registered = undefined
    }

    response.locals.paths = {
      back: patient.uri,
      next: patient.uri
    }

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`registration/${view}`)
  },

  update(request, response) {
    const { tab } = request.query
    const { data } = request.session
    const { __, paths, patient, session } = response.locals

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

    // Register attendance
    patient.register = new Registration({
      name: __(`registration.${key}.name`, { location: session.location }),
      registered,
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    // Capture vaccination outcome as absent from session if safe to vaccinate
    if (
      registered === false &&
      patient.outcome?.value !== PatientOutcome.CouldNotVaccinate
    ) {
      patient.capture = new Vaccination({
        location: session.location.name,
        urn: session.urn,
        outcome: VaccinationOutcome.AbsentSession,
        patient_uuid: patient.uuid,
        programme_pid: session.programmes[0],
        session_id: session.id,
        ...(data.token && { created_user_uid: data.token?.uid })
      })
    }

    // Update patient record
    data.patients[patient.uuid] = patient

    request.flash(
      'message',
      __(`registration.update.success.${patient.capture.key}`, { patient })
    )

    if (tab) {
      response.redirect(`${session.uri}/capture?tab=${tab}`)
    } else {
      response.redirect(paths.next)
    }
  }
}
