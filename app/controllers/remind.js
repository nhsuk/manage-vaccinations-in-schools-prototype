export const remindController = {
  update(request, response) {
    const { data } = request.session
    const { patient } = response.locals

    patient.remind = {
      fullName: patient.record.parent1.fullName,
      ...(data.token && { user_uid: data.token?.uid })
    }

    response.redirect(patient.uri)
  }
}
