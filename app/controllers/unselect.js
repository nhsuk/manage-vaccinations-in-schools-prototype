import { Cohort } from '../models/cohort.js'
import { getToday } from '../utils/date.js'

export const unselectController = {
  update(request, response) {
    const { data } = request.session
    const { uid } = request.body
    const { __, patient } = response.locals

    // Get cohort details
    const cohort = new Cohort({
      ...data.cohorts[uid],
      ...{ created: getToday() },
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    // Remove patient from cohort
    patient.removeFromCohort(cohort)

    // Update patient record
    data.patients[patient.uuid] = patient

    request.flash('success', __(`cohort.unselect.success`, { cohort, patient }))

    response.redirect(patient.uri)
  }
}
