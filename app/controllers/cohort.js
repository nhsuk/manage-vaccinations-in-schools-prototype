import { Cohort } from '../models/cohort.js'

export const cohortController = {
  readAll(request, response, next) {
    const { data } = request.session

    response.locals.cohorts = Cohort.readAll(data)

    next()
  },

  showAll(request, response) {
    response.render('cohort/list')
  },

  read(request, response, next) {
    const { uid } = request.params
    const { data } = request.session

    response.locals.cohort = Cohort.read(uid, data)

    next()
  },

  show(request, response) {
    response.render('cohort/show')
  }
}
