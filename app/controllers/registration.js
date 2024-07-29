import { Patient, PatientOutcome } from '../models/patient.js'
import { Registration } from '../models/registration.js'
import { Vaccination, VaccinationOutcome } from '../models/vaccination.js'

export const registrationController = {
  edit(request, response) {
    const { nhsn } = request.params
    const { data } = request.session

    const patient = new Patient(data.patients[nhsn])

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
    const { id, nhsn } = request.params
    const { tab } = request.query
    const { data } = request.session
    const { __, campaign, patient, session } = response.locals

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
        outcome: VaccinationOutcome.AbsentSession,
        patient_nhsn: patient.nhsn,
        campaign_uid: campaign.uid,
        session_id: session.id,
        ...(data.token && { created_user_uid: data.token?.uid })
      })
    }

    data.patients[nhsn] = patient

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
