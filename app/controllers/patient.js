import _ from 'lodash'

import { Cohort } from '../models/cohort.js'
import { Patient } from '../models/patient.js'
import { Record } from '../models/record.js'
import { School } from '../models/school.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const patientController = {
  read(request, response, next, nhsn) {
    const { data } = request.session

    let patient = Patient.read(nhsn, data)

    // If no patient found, use CHIS record (patient not imported yet)
    if (!patient) {
      const record = Record.readAll(data).find((record) => record.nhsn === nhsn)
      patient = new Patient(record, data)
    }

    response.locals.patient = patient

    next()
  },

  readAll(request, response, next) {
    const { q, hasMissingNhsNumber } = request.query
    const { data } = request.session

    let patients = Patient.readAll(data)

    // Sort
    patients = _.sortBy(patients, 'lastName')

    // Query
    if (q) {
      patients = patients.filter((patient) =>
        patient.tokenized.includes(String(q).toLowerCase())
      )
    }

    // Filter by missing NHS number
    if (hasMissingNhsNumber) {
      patients = patients.filter((patient) => patient.hasMissingNhsNumber)
    }

    // Clean up session data
    delete data.hasMissingNhsNumber
    delete data.q

    response.locals.patients = patients
    response.locals.results = getResults(patients, request.query)
    response.locals.pages = getPagination(patients, request.query)

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`patient/${view}`)
  },

  list(request, response) {
    response.render('patient/list')
  },

  filterList(request, response) {
    const { hasMissingNhsNumber, q } = request.body
    const params = new URLSearchParams()

    if (q) {
      params.append('q', String(q))
    }

    if (hasMissingNhsNumber?.includes('true')) {
      params.append('hasMissingNhsNumber', 'true')
    }

    response.redirect(`/patients?${params}`)
  },

  edit(request, response) {
    const { nhsn } = request.params
    const { data, referrer } = request.session
    const { patient } = response.locals

    // Setup wizard if not already setup
    if (!Patient.read(nhsn, data.wizard)) {
      patient.create(patient, data.wizard)
    }

    // Show back link to referring page, else patient page
    response.locals.back = referrer || patient.uri
    response.locals.patient = new Patient(Patient.read(nhsn, data.wizard), data)

    response.render('patient/edit')
  },

  update(request, response) {
    const { nhsn } = request.params
    const { data, referrer } = request.session
    const { __ } = response.locals

    const patient = new Patient(Patient.read(nhsn, data.wizard), data)

    request.flash('success', __('patient.edit.success'))

    // Clean up session data
    delete data.patient
    delete data.wizard

    // Update session data
    patient.update(patient, data)

    response.redirect(referrer || patient.uri)
  },

  readForm(request, response, next) {
    const { nhsn } = request.params
    const { data } = request.session

    const patient = Patient.read(nhsn, data.wizard)
    response.locals.patient = patient

    response.locals.paths = {
      back: `${patient.uri}/edit`,
      next: `${patient.uri}/edit`
    }

    response.locals.schoolItems = Object.values(data.schools)
      .map((school) => new School(school))
      .map((school) => ({
        text: school.name,
        value: school.urn,
        ...(school.address && {
          attributes: {
            'data-hint': school.address.formatted.singleline
          }
        })
      }))

    next()
  },

  showForm(request, response) {
    let { view } = request.params

    // Parent forms share same view
    if (view.includes('parent')) {
      response.locals.parentId = view.split('-')[1]
      view = 'parent'
    }

    response.render(`patient/form/${view}`)
  },

  updateForm(request, response) {
    const { data } = request.session
    const { paths, patient } = response.locals

    patient.update(request.body.patient, data.wizard)

    response.redirect(paths.next)
  },

  unselect(request, response) {
    const { data } = request.session
    const { uid } = request.body
    const { __, patient } = response.locals

    // Unselect patient from cohort
    const cohort = Cohort.read(uid, data)
    patient.unselectFromCohort(cohort, data)

    request.flash('success', __(`cohort.unselect.success`, { cohort, patient }))

    response.redirect(patient.uri)
  }
}
