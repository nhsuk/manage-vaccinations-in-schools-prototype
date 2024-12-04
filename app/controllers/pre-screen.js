export const preScreenController = {
  update(request, response) {
    const { data } = request.session
    const { patient, programme, session } = response.locals

    // Pre-screen interview
    patient.preScreen({
      note: data.preScreen.note,
      ...(data.token && { user_uid: data.token?.uid })
    })

    response.redirect(
      `${programme.uri}/vaccinations/new?patient_uuid=${patient.uuid}&session_id=${session.id}`
    )
  }
}
