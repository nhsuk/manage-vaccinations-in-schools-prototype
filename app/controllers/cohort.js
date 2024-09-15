import { Cohort } from '../models/cohort.js'
import { Record } from '../models/record.js'

export const cohortController = {
  readAll(request, response, next) {
    const { data } = request.session

    const cohorts = Object.values(data.cohorts).map((cohort) => {
      cohort = new Cohort(cohort)

      cohort.records = Object.values(data.patients)
        .filter((patient) => patient.cohorts.includes(cohort.uid))
        .map((patient) => new Record(patient.record))

      return cohort
    })

    response.locals.cohorts = cohorts

    next()
  },

  showAll(request, response) {
    response.render('cohort/list')
  },

  read(request, response, next) {
    const { uid } = request.params
    const { cohorts } = response.locals

    const cohort = cohorts.find((cohort) => cohort.uid === uid)

    request.app.locals.cohort = cohort

    next()
  },

  show(request, response) {
    response.render('cohort/show')
  }
}
