import _ from 'lodash'

import { PatientStatus } from '../enums.js'
import { Patient } from '../models/patient.js'
import { School } from '../models/school.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { formatYearGroup } from '../utils/string.js'

export const schoolController = {
  read(request, response, next, school_urn) {
    const { data } = request.session

    const school = School.findOne(school_urn, data)
    response.locals.school = school

    next()
  },

  readAll(request, response, next) {
    response.locals.schools = School.findAll(request.session.data)

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`school/${view}`)
  },

  list(request, response) {
    const { phase, q } = request.query
    const { data } = request.session
    const { schools } = response.locals

    let results = schools

    // Query
    if (q) {
      results = results.filter((school) =>
        school.tokenized.includes(String(q).toLowerCase())
      )
    }

    // Filter by phase
    if (phase) {
      results = results.filter((school) => school.phase === phase)
    }

    // Sort
    results = results.sort((a, b) => a.name.localeCompare(b.name))

    // Results
    response.locals.results = getResults(results, request.query, 40)
    response.locals.pages = getPagination(results, request.query, 40)

    // Clean up session data
    delete data.q
    delete data.phase

    response.render('school/list')
  },

  filterList(request, response) {
    const params = new URLSearchParams()

    // Radios and text inputs
    for (const key of ['phase', 'q']) {
      const value = request.body[key]
      if (value) {
        params.append(key, String(value))
      }
    }

    response.redirect(`/schools?${params}`)
  },

  readPatients(request, response, next) {
    const { option, programme_id, q, yearGroup } = request.query
    const { data } = request.session
    const { school } = response.locals

    const patients = Patient.findAll(data).filter(
      (patient) => patient.school_urn === school.urn
    )

    // Sort
    let results = _.sortBy(patients, 'lastName')

    // Query
    if (q) {
      results = results.filter((patient) =>
        patient.tokenized.includes(String(q).toLowerCase())
      )
    }

    // Convert year groups query into an array of numbers
    let yearGroups
    if (yearGroup) {
      yearGroups = Array.isArray(yearGroup) ? yearGroup : [yearGroup]
      yearGroups = yearGroups.map((year) => Number(year))
    }

    // Convert programme IDs into an array of IDs
    let programme_ids
    if (programme_id) {
      programme_ids = Array.isArray(programme_id)
        ? programme_id
        : [programme_id]
    }

    // Filter defaults
    const filters = {
      report: request.query.report || 'none',
      patientConsent: request.query.patientConsent || 'none',
      patientDeferred: request.query.patientDeferred || 'none',
      patientRefused: request.query.patientRefused || 'none',
      patientVaccinated: request.query.patientVaccinated || 'none',
      session: request.query.session || 'none'
    }

    // Filter by programme eligibility (if programme(s) selected)
    if (programme_id && filters.report !== PatientStatus.Ineligible) {
      results = results.filter((patient) =>
        programme_ids.some(
          (programme_id) =>
            patient.programmes[programme_id].status !== PatientStatus.Ineligible
        )
      )
    }

    // Filter by status
    if (filters.report && filters.report !== 'none') {
      const ids =
        programme_ids || school.programmes.map((programme) => programme.id)

      results = results.filter((patient) =>
        ids.some((id) => patient.programmes[id].status === filters.report)
      )
    }

    // Filter by sub-status(es)
    for (const [patientStatus, status] of Object.entries({
      [PatientStatus.Consent]: 'patientConsent',
      [PatientStatus.Deferred]: 'patientDeferred',
      [PatientStatus.Refused]: 'patientRefused',
      [PatientStatus.Vaccinated]: 'patientVaccinated'
    })) {
      if (filters.report === patientStatus && filters[status] !== 'none') {
        let statuses = filters[status]
        statuses = Array.isArray(statuses) ? statuses : [statuses]
        results = results.filter((patient) =>
          programme_ids.some((programme_id) =>
            statuses.includes(
              patient.programmes[programme_id].lastPatientSession?.[status]
            )
          )
        )
      }
    }

    // Filter by session date
    if (filters.session && filters.session !== 'none') {
      results = results.filter((patient) =>
        patient.patientSessions.some(
          (patientSession) =>
            patientSession.session.formatted.dateShort === filters.session
        )
      )
    }

    // Filter by year group
    if (yearGroup) {
      results = results.filter((patient) =>
        yearGroups.includes(patient.yearGroup)
      )
    }

    // Filter by display option
    for (const key of ['archived', 'hasMissingNhsNumber', 'post16']) {
      if (option?.includes(key)) {
        results = results.filter((patient) => patient[key])
      }
    }

    // Toggle initial view
    response.locals.initial =
      Object.keys(request.query).filter((key) => key !== 'referrer').length ===
      0

    // Results
    response.locals.school = school
    response.locals.patients = patients
    response.locals.results = getResults(results, request.query)
    response.locals.pages = getPagination(results, request.query)

    // Programme filter options
    response.locals.programmeItems = school.programmes.map((programme) => ({
      text: programme.name,
      value: programme.id,
      checked: programme_ids?.includes(programme.id) ?? false
    }))

    // Session date filter options
    response.locals.radioFilters = {
      session: Object.fromEntries(
        school.sessions.map((session) => [
          session.id,
          session.formatted.dateShort
        ])
      )
    }

    // Year group filter options
    response.locals.yearGroupItems = school.yearGroups.map((yearGroup) => ({
      text: formatYearGroup(yearGroup),
      value: yearGroup
    }))

    // Clean up session data
    delete data.option
    delete data.patientConsent
    delete data.patientDeferred
    delete data.patientRefused
    delete data.patientVaccinated
    delete data.programme_id
    delete data.q
    delete data.report
    delete data.session
    delete data.yearGroup

    next()
  },

  filterPatients(request, response) {
    const { school } = response.locals

    const params = new URLSearchParams()

    // Radios and text inputs
    for (const key of ['q', 'report', 'session']) {
      const value = request.body[key]
      if (value) {
        params.append(key, String(value))
      }
    }

    // Checkboxes
    for (const key of [
      'option',
      'patientConsent',
      'patientDeferred',
      'patientRefused',
      'patientVaccinated',
      'programme_id',
      'yearGroup'
    ]) {
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

    response.redirect(`${school.uri}?${params}`)
  },

  readSessions(request, response) {
    const { school } = response.locals

    response.locals.sessions = school.sessions

    response.render('school/sessions')
  }
}
