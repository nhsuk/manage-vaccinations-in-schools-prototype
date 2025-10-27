import { SessionType } from '../enums.js'
import { Programme } from '../models/programme.js'
import { getDateValueDifference } from '../utils/date.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const programmeController = {
  read(request, response, next, programme_id) {
    response.locals.programme = Programme.findOne(
      programme_id,
      request.session.data
    )

    next()
  },

  readAll(request, response, next) {
    response.locals.programmes = Programme.findAll(request.session.data)

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`programme/${view}`)
  },

  list(request, response) {
    response.render('programme/list')
  },

  readSessions(request, response, next) {
    const { q } = request.query
    const { data } = request.session
    const { currentAcademicYear } = response.app.locals
    const { __ } = response.locals
    const { programme } = response.locals
    const sessions = programme.sessions

    let results = sessions

    // Query
    if (q) {
      results = results.filter((session) =>
        session.tokenized.includes(String(q).toLowerCase())
      )
    }

    // Filter defaults
    const filters = {
      academicYear: request.query?.academicYear || currentAcademicYear,
      status: request.query?.status || 'none',
      type: request.query?.type || 'none'
    }

    // Filter by status
    if (filters.status !== 'none') {
      results = results.filter((session) => session[filters.status])
    }

    // Filter by type
    if (filters.type !== 'none') {
      results = results.filter(({ type }) => type === filters.type)
    }

    // Sort
    results = results.sort((a, b) =>
      getDateValueDifference(b.firstDate, a.firstDate)
    )

    // Results
    response.locals.results = getResults(results, request.query, 40)
    response.locals.pages = getPagination(results, request.query, 40)

    // Status filter options
    response.locals.statusItems = [
      {
        text: 'Any',
        value: 'none',
        checked: !filters.status || filters.status === 'none'
      },
      ...Object.values([
        'isActive',
        'isUnplanned',
        'isPlanned',
        'isCompleted',
        'isClosed'
      ]).map((value) => ({
        text: __(`session.${value}.label`),
        value,
        checked: filters.status === value
      }))
    ]

    // Type filter options
    response.locals.typeItems = [
      {
        text: 'Any',
        value: 'none',
        checked: filters.type === 'none'
      },
      ...Object.values(SessionType).map((value) => ({
        text: value,
        value,
        checked: filters.type === value
      }))
    ]

    // Clean up session data
    delete data.q
    delete data.status
    delete data.type

    response.render('programme/sessions', { sessions })
  },

  filterSessions(request, response) {
    const { programme_id } = request.params
    const params = new URLSearchParams()

    // Radios
    for (const key of ['academicYear', 'q', 'status', 'type']) {
      const value = request.body[key]
      if (value) {
        params.append(key, String(value))
      }
    }

    // Checkboxes
    for (const key of ['programme_ids']) {
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
