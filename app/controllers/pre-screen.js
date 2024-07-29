import { Patient } from '../models/patient.js'

export const preScreenController = {
  new(request, response) {
    const { id, nhsn } = request.params
    const { data } = request.session
    const { campaign } = response.locals

    const patient = new Patient(data.patients[nhsn])

    // Pre-screen interview
    patient.preScreen = {
      notes: data.preScreen.notes,
      ...(data.token && { user_uid: data.token?.uid })
    }

    response.redirect(
      `${campaign.uri}/vaccinations/new?patient_nhsn=${nhsn}&session_id=${id}`
    )
  }
}
