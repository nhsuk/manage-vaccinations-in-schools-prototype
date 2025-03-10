import _ from 'lodash'

import { PatientOutcome } from '../models/patient-session.js'
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
    const { hasMissingNhsNumber, q, record, report } = request.query
    const { data } = request.session

    const programme = Programme.read(pid, data)

    response.locals.programme = programme

    let results = []

    const filters = {
      record: record || 'none',
      report: report || 'none'
    }

    // Search
    const view = request.path.split('/').at(-1)
    if (view === 'patients') {
      results = programme.patientSessions

      // Filter by programme outcome
      if (filters.report !== 'none') {
        results = results.filter(
          (patientSession) => patientSession.report === filters.report
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

      // Query
      if (q) {
        results = results.filter(({ patient }) =>
          patient.tokenized.includes(String(q).toLowerCase())
        )
      }

      // Sort
      results = _.sortBy(results, 'lastName')
    } else if (view === 'vaccinations') {
      results = _.sortBy(programme.vaccinations, 'createdAt').reverse()
    }

    // Results
    response.locals.results = getResults(results, request.query)
    response.locals.pages = getPagination(results, request.query)

    // Filter option items
    response.locals.statusItems = [
      {
        text: 'Any',
        value: 'none',
        checked: filters.record === 'none'
      },
      ...Object.values(PatientOutcome).map((value) => ({
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

    for (const key of ['q', 'record', 'report']) {
      const param = request.body[key]
      if (param) {
        params[key] = String(param)
      }
    }

    if (hasMissingNhsNumber?.includes('true')) {
      params.hasMissingNhsNumber = true
    }

    // @ts-ignore
    const queryString = new URLSearchParams(params).toString()

    response.redirect(`/programmes/${pid}/patients?${queryString}`)
  }
}
