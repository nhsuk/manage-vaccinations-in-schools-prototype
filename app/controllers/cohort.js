import { Cohort } from '../models/cohort.js'

export const cohortController = {
  read(request, response, next, cohort_uid) {
    response.locals.cohort = Cohort.read(cohort_uid, request.session.data)

    next()
  },

  readAll(request, response, next) {
    response.locals.cohorts = Cohort.readAll(request.session.data)

    next()
  },

  show(request, response) {
    response.render('cohort/show')
  },

  list(request, response) {
    response.render('cohort/list')
  }
}
