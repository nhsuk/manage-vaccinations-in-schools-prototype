import _ from 'lodash'

import { School, SchoolPhase } from '../models/school.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { formatYearGroup } from '../utils/string.js'

export const schoolController = {
  readAll(request, response, next) {
    const { data } = request.session

    response.locals.schools = School.readAll(data)

    // Filter
    response.locals.phaseItems = Object.values(SchoolPhase).map((phase) => ({
      text: phase,
      value: phase
    }))

    next()
  },

  showAll(request, response) {
    response.render('school/list')
  },

  read(request, response, next) {
    const { urn } = request.params
    const { data } = request.session

    response.locals.school = School.read(urn, data)

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'
    let { page, limit } = request.query
    const { school } = response.locals

    page = parseInt(page) || 1
    limit = parseInt(limit) || 100

    // Sort
    const consents = _.sortBy(school.consents, 'createdAt')
    const patients = _.sortBy(school.patients, 'lastName')

    // Filter
    response.locals.yearGroupItems = school.yearGroups.map((yearGroup) => ({
      text: formatYearGroup(yearGroup),
      value: yearGroup
    }))

    // Paginate
    if (view === 'consents') {
      response.locals.results = getResults(consents, page, limit)
      response.locals.pages = getPagination(consents, page, limit)
    } else if (view === 'patients') {
      response.locals.results = getResults(patients, page, limit)
      response.locals.pages = getPagination(patients, page, limit)
    }

    response.render(`school/${view}`)
  }
}
