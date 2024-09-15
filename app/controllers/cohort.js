import { Cohort } from '../models/cohort.js'
import { Patient } from '../models/patient.js'

export const cohortController = {
  list(request, response) {
    const { data } = request.session

    response.render('cohort/list', {
      cohorts: Object.values(data.cohorts).map((cohort) => new Cohort(cohort))
    })
  },

  show(request, response) {
    response.render('cohort/show')
  },

  read(request, response, next) {
    const { uid } = request.params
    const { data } = request.session

    const cohort = new Cohort(data.cohorts[uid])

    request.app.locals.cohort = cohort
    request.app.locals.records = Object.values(data.patients)
      .filter((patient) => patient.cohorts.includes(uid))
      .map((patient) => new Patient(patient))

    next()
  }
}
