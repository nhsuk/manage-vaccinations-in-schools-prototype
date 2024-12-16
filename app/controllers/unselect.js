import { Cohort } from '../models/cohort.js'
import { today } from '../utils/date.js'

export const unselectController = {
  update(request, response) {
    const { data } = request.session
    const { uid } = request.body
    const { __, patient } = response.locals

    // Get cohort details
    const cohort = new Cohort(
      {
        ...data.cohorts[uid],
        ...{ createdAt: today() },
        ...(data.token && { createdBy_uid: data.token?.uid })
      },
      data
    )

    // Reject patient from cohort
    patient.rejectFromCohort(cohort)

    // Update patient record
    data.patients[patient.uuid] = patient

    request.flash('success', __(`cohort.unselect.success`, { cohort, patient }))

    response.redirect(patient.uri)
  }
}
