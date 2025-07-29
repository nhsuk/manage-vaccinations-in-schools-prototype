import _ from 'lodash'

import { Programme } from '../models/programme.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { formatYearGroup } from '../utils/string.js'

export const programmeController = {
  read(request, response, next, programme_id) {
    response.locals.programme = Programme.read(
      programme_id,
      request.session.data
    )

    next()
  },

  readAll(request, response, next) {
    response.locals.programmes = Programme.readAll(request.session.data)

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`programme/${view}`)
  },

  list(request, response) {
    response.render('programme/list')
  },

  readPatients(request, response, next) {
    const { options, q, yearGroup } = request.query
    const { data } = request.session
    const { programme } = response.locals
    let patientSessions = programme.patientSessions

    // Convert year groups query into an array of numbers
    let yearGroups
    if (yearGroup) {
      yearGroups = Array.isArray(yearGroup) ? yearGroup : [yearGroup]
      yearGroups = yearGroups.map((year) => Number(year))
    }

    // Query
    if (q) {
      patientSessions = patientSessions.filter(({ patient }) =>
        patient.tokenized.includes(String(q).toLowerCase())
      )
    }

    // Filter by outcome
    for (const name of ['consent', 'screen', 'report']) {
      const outcome = request.query[name]
      if (outcome && outcome !== 'none') {
        patientSessions = patientSessions.filter(
          (patientSession) => patientSession[name] === outcome
        )
      }
    }

    // Filter by year group
    if (yearGroup) {
      patientSessions = patientSessions.filter((patientSession) =>
        yearGroups.includes(patientSession.yearGroup)
      )
    }

    // Filter by display option
    for (const option of ['archived', 'hasMissingNhsNumber', 'post16']) {
      if (options?.includes(option)) {
        patientSessions = patientSessions.filter(
          ({ patient }) => patient[option]
        )
      }
    }

    // Sort
    patientSessions = _.sortBy(patientSessions, 'lastName')

    // Results
    response.locals.results = getResults(patientSessions, request.query)
    response.locals.pages = getPagination(patientSessions, request.query)

    // Filters
    response.locals.yearGroupItems = programme.cohorts.map((cohort) => ({
      text: formatYearGroup(cohort.yearGroup),
      value: cohort.yearGroup,
      checked: yearGroups?.includes(cohort.yearGroup)
    }))

    // Clean up session data
    delete data.options
    delete data.q
    delete data.consent
    delete data.screen
    delete data.report

    next()
  },

  filterPatients(request, response) {
    const { programme_id } = request.params
    const params = new URLSearchParams()

    // Radios
    for (const key of ['q', 'consent', 'screen', 'report']) {
      const value = request.body[key]
      if (value) {
        params.append(key, String(value))
      }
    }

    // Checkboxes
    for (const key of ['options', 'yearGroup']) {
      const value = request.body[key]
      const values = Array.isArray(value) ? value : [value]
      if (value) {
        values
          .filter((item) => item !== '_unchecked')
          .forEach((value) => {
            params.append(key, String(value))
          })
      }
    }

    response.redirect(`/programmes/${programme_id}/patients?${params}`)
  }
}
