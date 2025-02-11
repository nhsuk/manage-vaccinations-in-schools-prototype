import _ from 'lodash'

import { PatientOutcome } from '../models/patient-session.js'
import { Programme } from '../models/programme.js'
import { VaccinationOutcome } from '../models/vaccination.js'
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
    let { page, limit, hasMissingNhsNumber, q, outcome, record } = request.query
    const { data } = request.session

    const programme = Programme.read(pid, data)

    response.locals.programme = programme

    let results = []

    const filters = {
      outcome: outcome || 'none',
      record: record || 'none'
    }

    // Paginate
    page = parseInt(page) || 1
    limit = parseInt(limit) || 200

    // Search
    const view = request.path.split('/').at(-1)
    if (view === 'patients') {
      results = programme.patientSessions

      // Filter by programme outcome
      if (filters.outcome !== 'none') {
        results = results.filter(
          (patientSession) => patientSession.outcome === filters.outcome
        )
      }

      // Filter by vaccination record status
      if (filters.record !== 'none') {
        results = results.filter(
          (patientSession) => patientSession.record === filters.record
        )
      }

      // Filter by missing NHS number
      if (hasMissingNhsNumber) {
        results = results.filter(({ patient }) => patient.hasMissingNhsNumber)
      }

      // Sort
      results = _.sortBy(results, 'lastName')

      // Query
      if (q) {
        results = results.filter(({ patient }) =>
          patient.tokenized.includes(String(q).toLowerCase())
        )
      }
    } else if (view === 'vaccinations') {
      results = _.sortBy(programme.vaccinations, 'createdAt').reverse()
    }

    // Results
    response.locals.results = getResults(results, page, limit)
    response.locals.pages = getPagination(results, page, limit)

    // Filter option items
    response.locals.outcomeItems = [
      {
        text: 'All',
        value: 'none',
        checked: filters.outcome === 'none'
      },
      ...Object.values(PatientOutcome).map((value) => ({
        text: value,
        value,
        checked: value === filters.outcome
      }))
    ]

    response.locals.statusItems = [
      {
        text: 'All',
        value: 'none',
        checked: filters.record === 'none'
      },
      ...Object.values(VaccinationOutcome).map((value) => ({
        text: value,
        value,
        checked: value === filters.record
      }))
    ]

    response.locals.yearGroupItems = programme.cohorts.map((cohort) => ({
      text: formatYearGroup(cohort.yearGroup),
      value: cohort.yearGroup
    }))

    // Clean up session data
    delete data.hasMissingNhsNumber
    delete data.q

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`programme/${view}`)
  },

  updatePatients(request, response) {
    const { pid } = request.params
    const { hasMissingNhsNumber } = request.body

    const params = {}

    for (const key of ['q', 'outcome', 'record']) {
      const param = request.body[key]
      if (param) {
        params[key] = String(param)
      }
    }

    if (hasMissingNhsNumber.includes('true')) {
      params.hasMissingNhsNumber = true
    }

    // @ts-ignore
    const queryString = new URLSearchParams(params).toString()

    response.redirect(`/programmes/${pid}/patients?${queryString}`)
  }
}
