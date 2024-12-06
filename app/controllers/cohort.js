import { Cohort } from '../models/cohort.js'

export const cohortController = {
  readAll(request, response, next) {
    const { data } = request.session

    const cohorts = Object.values(data.cohorts).map(
      (cohort) => new Cohort(cohort, data)
    )

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
