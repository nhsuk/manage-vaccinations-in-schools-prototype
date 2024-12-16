import _ from 'lodash'

import { Programme } from '../models/programme.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { formatYearGroup } from '../utils/string.js'

export const programmeController = {
  readAll(request, response, next) {
    const { data } = request.session

    response.locals.programmes = Programme.readAll(data)

    next()
  },

  showAll(request, response) {
    response.render('programme/list')
  },

  read(request, response, next) {
    const { pid } = request.params
    const { data } = request.session

    response.locals.programme = Programme.read(pid, data)

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'
    let { page, limit } = request.query
    const { programme } = response.locals

    page = parseInt(page) || 1
    limit = parseInt(limit) || 100

    // Paginate
    if (view === 'vaccinations') {
      response.locals.results = getResults(programme.vaccinations, page, limit)
      response.locals.pages = getPagination(programme.vaccinations, page, limit)
    } else if (view === 'patients') {
      // Sort
      const patientSessions = _.sortBy(programme.patientSessions, 'lastName')

      response.locals.cohortItems = programme.cohorts.map((cohort) => ({
        text: formatYearGroup(cohort.yearGroup),
        value: cohort.yearGroup
      }))
      response.locals.results = getResults(patientSessions, page, limit)
      response.locals.pages = getPagination(patientSessions, page, limit)
    }

    response.render(`programme/${view}`)
  }
}
