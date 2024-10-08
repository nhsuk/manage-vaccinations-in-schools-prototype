import { PatientOutcome } from '../models/patient.js'
import { Programme } from '../models/programme.js'
import { Registration } from '../models/registration.js'
import { Vaccination, VaccinationOutcome } from '../models/vaccination.js'

export const registrationController = {
  read(request, response, next) {
    const { patient } = response.locals

    response.locals.paths = {
      back: patient.uriInSession,
      next: patient.uriInSession
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

    if (registered === true) {
      // Register attendance
      patient.register = new Registration({
        name: __(`registration.${key}.name`, { location: session.location }),
        registered,
        ...(data.token && { created_user_uid: data.token?.uid })
      })
    } else if (
      registered === false &&
      patient.outcome?.value !== PatientOutcome.CouldNotVaccinate
    ) {
      // Capture vaccination outcome as absent from session if safe to vaccinate
      const programme = new Programme(data.programmes[session.programmes[0]])
      const absentVaccination = new Vaccination({
        location: session.location.name,
        urn: session.urn,
        outcome: VaccinationOutcome.AbsentSession,
        patient_uuid: patient.uuid,
        programme_pid: programme.pid,
        session_id: session.id,
        vaccine_gtin: programme.vaccine.gtin,
        ...(data.token && { created_user_uid: data.token?.uid })
      })

      // Add vaccination
      data.vaccinations[absentVaccination.uuid] = absentVaccination

      // Add vaccination outcome to patient
      patient.capture = absentVaccination
    } else {
      delete patient.registered
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
