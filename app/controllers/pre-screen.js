import { Patient } from '../models/patient.js'

export const preScreenController = {
  new(request, response) {
    const { id, nhsn } = request.params
    const { data } = request.session

    const patient = new Patient(data.patients[nhsn])

    // Pre-screen interview
    patient.preScreen = {
      notes: data.preScreen.notes,
      ...(data.token && { user_uuid: data.token.uuid })
    }

    response.redirect(`/sessions/${id}/${nhsn}/vaccinations/new`)
  }
}
