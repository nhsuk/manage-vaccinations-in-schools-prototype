export const moveController = {
  update(request, response) {
    const { session } = request.app.locals
    const { referrer } = request.query
    const { data } = request.session
    const { __, patient } = response.locals

    const { moved } = data.patient
    if (moved === 'In' || moved === 'Out') {
      patient.move = {
        ...(data.token && { created_user_uid: data.token?.uid })
      }
      request.flash('success', __(`move.success.${moved}`, { patient }))
    } else {
      request.flash('message', __(`move.success.ignore`, { patient }))
    }

    if (moved === 'In') {
      patient.session_id = session?.id
    } else if (moved === 'false') {
      delete patient.record.pendingChanges.urn
    }

    // Update patient record
    data.patients[patient.uuid] = patient

    const next = session ? referrer : patient.uri

    response.redirect(next)
  }
}
