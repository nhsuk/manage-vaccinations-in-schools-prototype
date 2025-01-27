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
    let { page, limit, hasMissingNhsNumber, q } = request.query
    const { data } = request.session

    const programme = Programme.read(pid, data)

    response.locals.programme = programme

    let results = []

    // Paginate
    page = parseInt(page) || 1
    limit = parseInt(limit) || 200

    // Search
    const view = request.path.split('/').at(-1)
    if (view === 'patients') {
      // Sort
      results = _.sortBy(programme.patientSessions, 'lastName')

      // Filter
      if (hasMissingNhsNumber) {
        results = results.filter(({ patient }) => patient.hasMissingNhsNumber)
      }

      // Query
      if (q) {
        results = results.filter(({ patient }) =>
          patient.tokenized.includes(String(q).toLowerCase())
        )
      }
    } else if (view === 'vaccinations') {
      results = _.sortBy(programme.vaccinations, 'createdAt').reverse()
    }

    // Clean up session data
    delete data.hasMissingNhsNumber
    delete data.q

    // Results
    response.locals.results = getResults(results, page, limit)
    response.locals.pages = getPagination(results, page, limit)

    // Filters
    response.locals.statusItems = [
      { value: 'Ready for vaccinator', text: 'Ready for vaccinator' },
      { value: 'Do not vaccinate', text: 'Do not vaccinate' },
      { value: 'Request failed', text: 'Request failed' },
      { value: 'No response', text: 'No response' },
      { value: 'Conflicting consent', text: 'Conflicting consent' },
      { value: 'Needs triage', text: 'Needs triage' }
    ]
    response.locals.yearGroupItems = programme.cohorts.map((cohort) => ({
      text: formatYearGroup(cohort.yearGroup),
      value: cohort.yearGroup
    }))

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`programme/${view}`)
  },

  updatePatients(request, response) {
    const { pid } = request.params
    const { hasMissingNhsNumber, q } = request.body

    const params = {}

    if (q) {
      params.q = String(q)
    }

    if (hasMissingNhsNumber.includes('true')) {
      params.hasMissingNhsNumber = true
    }

    // @ts-ignore
    const queryString = new URLSearchParams(params).toString()

    response.redirect(`/programmes/${pid}/patients?${queryString}`)
  }
}
