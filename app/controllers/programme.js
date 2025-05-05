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
    const { hasMissingNhsNumber, q, yearGroup } = request.query
    const { data } = request.session

    const programme = Programme.read(pid, data)

    response.locals.programme = programme

    // Convert year groups query into an array of numbers
    let yearGroups
    if (yearGroup) {
      yearGroups = Array.isArray(yearGroup) ? yearGroup : [yearGroup]
      yearGroups = yearGroups.map((year) => Number(year))
    }

    let results = []

    // Search
    const view = request.path.split('/').at(-1)
    if (view === 'patients') {
      results = programme.patientSessions

      // Query
      if (q) {
        results = results.filter(({ patient }) =>
          patient.tokenized.includes(String(q).toLowerCase())
        )
      }

      // Filter by outcome
      for (const name of ['consent', 'screen', 'report']) {
        const outcome = request.query[name]
        if (outcome && outcome !== 'none') {
          results = results.filter(
            (patientSession) => patientSession[name] === outcome
          )
        }
      }

      // Filter by year group
      if (yearGroup) {
        results = results.filter(({ patient }) =>
          yearGroups.includes(patient.yearGroup)
        )
      }

      // Filter by missing NHS number
      if (hasMissingNhsNumber) {
        results = results.filter(({ patient }) => patient.hasMissingNhsNumber)
      }

      // Sort
      results = _.sortBy(results, 'lastName')
    } else if (view === 'vaccinations') {
      results = _.sortBy(programme.vaccinations, 'createdAt').reverse()
    }

    // Results
    response.locals.results = getResults(results, request.query)
    response.locals.pages = getPagination(results, request.query)

    // Filters
    response.locals.yearGroupItems = programme.cohorts.map((cohort) => ({
      text: formatYearGroup(cohort.yearGroup),
      value: cohort.yearGroup,
      checked: yearGroups?.includes(cohort.yearGroup)
    }))

    // Clean up session data
    delete data.hasMissingNhsNumber
    delete data.q
    delete data.consent
    delete data.screen
    delete data.report

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`programme/${view}`)
  },

  updatePatients(request, response) {
    const { pid } = request.params
    const { hasMissingNhsNumber, yearGroup } = request.body
    const params = new URLSearchParams()

    for (const key of ['q', 'consent', 'screen', 'report']) {
      const param = request.body[key]
      if (param) {
        params.append(key, String(param))
      }
    }

    if (yearGroup) {
      const yearGroups = Array.isArray(yearGroup) ? yearGroup : [yearGroup]
      yearGroups
        .filter((item) => item !== '_unchecked')
        .forEach((year) => {
          params.append('yearGroup', String(year))
        })
    }

    if (hasMissingNhsNumber?.includes('true')) {
      params.append('hasMissingNhsNumber', 'true')
    }

    response.redirect(`/programmes/${pid}/patients?${params}`)
  }
}
