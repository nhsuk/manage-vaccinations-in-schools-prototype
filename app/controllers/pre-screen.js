export const preScreenController = {
  new(request, response) {
    const { id, nhsn } = request.params
    const { data } = request.session
    const { programme } = response.locals

    const patient = Object.values(data.patients).find(
      (patient) => patient.record.nhsn === nhsn
    )

    // Pre-screen interview
    patient.preScreen = {
      notes: data.preScreen.notes,
      ...(data.token && { user_uid: data.token?.uid })
    }

    response.redirect(
      `${programme.uri}/vaccinations/new?patient_uuid=${patient.uuid}&session_id=${id}`
    )
  }
}
