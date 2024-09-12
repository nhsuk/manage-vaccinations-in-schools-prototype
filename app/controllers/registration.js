import { Patient, PatientOutcome } from '../models/patient.js'
import { Registration } from '../models/registration.js'
import { Vaccination, VaccinationOutcome } from '../models/vaccination.js'

export const registrationController = {
  edit(request, response) {
    const { nhsn } = request.params
    const { data } = request.session

    const patient = Object.values(data.patients).find(
      (patient) => patient.record.nhsn === nhsn
    )

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

    response.render('registration/edit')
  },

  update(request, response) {
    const { id } = request.params
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

    data.patients[patient.uuid] = patient

    request.flash(
      'message',
      __(`registration.update.success.${patient.capture.key}`, { patient })
    )

    if (tab) {
      response.redirect(`/sessions/${id}/capture?tab=${tab}`)
    } else {
      response.redirect(patient.uri)
    }
  }
}
