import { getSessionPatientPath } from '../utils/session.js'

export const preScreenController = {
  update(request, response) {
    const { data } = request.session
    const { patient, programme, session } = response.locals

    // Pre-screen interview
    patient.preScreen({
      note: data.preScreen.note,
      ...(data.token && { user_uid: data.token?.uid })
    })

    const referrer = getSessionPatientPath(session, patient)

    response.redirect(
      `${programme.uri}/vaccinations/new?patient_uuid=${patient.uuid}&session_id=${session.id}&referrer=${referrer}`
    )
  }
}
