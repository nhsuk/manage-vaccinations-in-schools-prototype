import { Patient } from '../models/patient.js'

export const preScreenController = {
  new(request, response) {
    const { id, nhsn } = request.params
    const { data } = request.session
    const { campaign } = response.locals

    const patient = Object.values(data.patients).find(
      (patient) => patient.record.nhsn === nhsn
    )

    // Pre-screen interview
    patient.preScreen = {
      notes: data.preScreen.notes,
      ...(data.token && { user_uid: data.token?.uid })
    }

    response.redirect(
      `${campaign.uri}/vaccinations/new?patient_uuid=${patient.uuid}&session_id=${id}`
    )
  }
}
