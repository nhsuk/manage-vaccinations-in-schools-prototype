import _ from 'lodash'

import { AcademicYear, PatientStatus } from '../enums.js'
import { Patient } from '../models/patient.js'
import { Programme } from '../models/programme.js'
import { School } from '../models/school.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { formatYearGroup } from '../utils/string.js'

export const schoolController = {
  read(request, response, next, school_urn) {
    let { options, programme_ids, q, yearGroup } = request.query
    const { data } = request.session

    const school = School.findOne(school_urn, request.session.data)
    const latestAcademicYear = Object.values(AcademicYear).at(-1)
    const programmes = Programme.findAll(data)
      .filter((programme) => programme.year === latestAcademicYear)
      .sort((a, b) => a.name.localeCompare(b.name))

    const patients = Patient.findAll(data).filter(
      (patient) => patient.school_urn === school.urn
    )

    // Sort
    let results = _.sortBy(patients, 'lastName')

    // Convert year groups query into an array of numbers
    let yearGroups
    if (yearGroup) {
      yearGroups = Array.isArray(yearGroup) ? yearGroup : [yearGroup]
      yearGroups = yearGroups.map((year) => Number(year))
    }

    // Query
    if (q) {
      results = results.filter((patient) =>
        patient.tokenized.includes(String(q).toLowerCase())
      )
    }

    // Filter by programme
    if (programme_ids) {
      programme_ids = Array.isArray(programme_ids)
        ? programme_ids
        : [programme_ids]
      results = results.filter((patient) =>
        programme_ids.some((id) => patient.programme_ids.includes(id))
      )
    }

    // Filter by instruct/register/report/sub status
    const filters = {
      report: request.query.report || 'none',
      patientConsent: request.query.patientConsent || 'none',
      patientDeferred: request.query.patientDeferred || 'none',
      patientRefused: request.query.patientRefused || 'none',
      patientVaccinated: request.query.patientVaccinated || 'none'
    }

    // Filter by status
    if (filters.report && filters.report !== 'none' && programme_ids) {
      results = results.filter((patient) =>
        patient.patientSessions.some(
          (patientSession) =>
            patientSession.report === filters.report &&
            programme_ids.includes(patientSession.programme_id)
        )
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
        results.filter((patient) =>
          patient.patientSessions.filter(
            (patientSession) =>
              statuses.includes(patientSession[status]) &&
              programme_ids.includes(patientSession.programme_id)
          )
        )
      }
    }

    // Filter by year group
    if (yearGroup) {
      results = results.filter((patient) =>
        yearGroups.includes(patient.yearGroup)
      )
    }

    // Filter by display option
    for (const option of ['archived', 'hasMissingNhsNumber', 'post16']) {
      if (options?.includes(option)) {
        results = results.filter((patient) => patient[option])
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
    response.locals.programmeItems = programmes.map((programme) => ({
      text: programme.name,
      value: programme.id,
      checked: programme_ids?.includes(programme.id)
    }))

    // Year group filter options
    response.locals.yearGroupItems = school.yearGroups.map((yearGroup) => ({
      text: formatYearGroup(yearGroup),
      value: yearGroup
    }))

    // Clean up session data
    delete data.options
    delete data.patientConsent
    delete data.patientDeferred
    delete data.patientRefused
    delete data.patientVaccinated
    delete data.programme_ids
    delete data.report
    delete data.q
    delete data.yearGroup

    next()
  },

  readAll(request, response, next) {
    response.locals.schools = School.findAll(request.session.data)

    next()
  },

  show(request, response) {
    response.render(`school/show`)
  },

  list(request, response) {
    response.render('school/list')
  },

  filterPatients(request, response) {
    const { school } = response.locals

    const params = new URLSearchParams()

    // Radios and text inputs
    for (const key of ['q', 'report']) {
      const value = request.body[key]
      if (value) {
        params.append(key, String(value))
      }
    }

    // Checkboxes
    for (const key of [
      'options',
      'patientConsent',
      'patientDeferred',
      'patientRefused',
      'patientVaccinated',
      'programme_ids',
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
  }
}
