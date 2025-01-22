import _ from 'lodash'

import { School } from '../models/school.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { formatYearGroup } from '../utils/string.js'

export const schoolController = {
  readAll(request, response, next) {
    const { data } = request.session

    response.locals.schools = School.readAll(data)

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
    const patientSessions = _.sortBy(school.patientSessions, 'lastName')

    // Filter
    response.locals.yearGroupItems = school.yearGroups.map((yearGroup) => ({
      text: formatYearGroup(yearGroup),
      value: yearGroup
    }))

    // Paginate
    response.locals.results = getResults(patientSessions, page, limit)
    response.locals.pages = getPagination(patientSessions, page, limit)

    response.render(`school/${view}`)
  }
}
