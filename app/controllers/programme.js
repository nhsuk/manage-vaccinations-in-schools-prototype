import _ from 'lodash'

import { Activity, PatientOutcome } from '../models/patient-session.js'
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
    const { activity, hasMissingNhsNumber, q, report, yearGroup } =
      request.query
    const { data } = request.session

    const programme = Programme.read(pid, data)

    response.locals.programme = programme

    const filters = {
      activity: activity || 'none',
      report: report || 'none'
    }

    // Convert year groups query into an array of numbers
    let yearGroups
    if (yearGroup) {
      yearGroups = Array.isArray(yearGroup) ? yearGroup : [yearGroup]
      yearGroups = yearGroups.map((year) => Number(year))
    }

    // Search
    let results = programme.patientSessions

    // Filter by action required
    if (filters.activity !== 'none') {
      results = results.filter(
        ({ nextActivity }) => nextActivity === filters.activity
      )
    }

    // Filter by programme outcome
    if (filters.report !== 'none') {
      results = results.filter(({ report }) => report === filters.outcome)
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

    // Query
    if (q) {
      results = results.filter(({ patient }) =>
        patient.tokenized.includes(String(q).toLowerCase())
      )
    }

    // Sort
    results = _.sortBy(results, 'patient.lastName')

    // Results
    response.locals.results = getResults(results, request.query)
    response.locals.pages = getPagination(results, request.query)

    // Filter option items
    response.locals.activityItems = [
      {
        text: 'All',
        value: 'none',
        checked: filters.activity === 'none'
      },
      ...Object.values(Activity)
        .filter((value) => value !== Activity.Register)
        .map((value) => ({
          text: value,
          value,
          checked: value === filters.activity
        }))
    ]

    response.locals.statusItems = [
      {
        text: 'All',
        value: 'none',
        checked: filters.report === 'none'
      },
      ...Object.values(PatientOutcome).map((value) => ({
        text: value,
        value,
        checked: value === filters.report
      }))
    ]

    response.locals.yearGroupItems = programme.cohorts.map((cohort) => ({
      text: formatYearGroup(cohort.yearGroup),
      value: cohort.yearGroup,
      checked: yearGroups?.includes(cohort.yearGroup)
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
    const { hasMissingNhsNumber, yearGroup } = request.body

    const params = new URLSearchParams()

    for (const key of ['activity', 'q', 'report']) {
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
