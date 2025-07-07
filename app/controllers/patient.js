import _ from 'lodash'

import { ArchiveRecordReason } from '../enums.js'
import { Patient } from '../models/patient.js'
import { Record } from '../models/record.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const patientController = {
  read(request, response, next, nhsn) {
    const { data } = request.session
    const { __ } = response.locals

    let patient = Patient.read(nhsn, data)

    // If no patient found, use CHIS record (patient not imported yet)
    if (!patient) {
      const record = Record.readAll(data).find((record) => record.nhsn === nhsn)
      patient = new Patient(record, data)
    }

    response.locals.patient = patient

    response.locals.recordTitle = patient.post16
      ? __('patient.label').replace('Child', 'Patient')
      : __('patient.label')

    response.locals.archiveRecordReasonItems = Object.values(
      ArchiveRecordReason
    )
      .filter((value) => value !== ArchiveRecordReason.Deceased)
      .map((value) => ({
        text: value,
        value
      }))

    next()
  },

  readAll(request, response, next) {
    const { options, q } = request.query
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

    // Filter out archived records by default
    if (!options?.includes('archived')) {
      patients = patients.filter(({ archived }) => !archived)
    }

    // Filter out post-16 records by default
    if (!options?.includes('post16')) {
      patients = patients.filter(({ post16 }) => !post16)
    }

    // Filter
    for (const option of ['archived', 'hasMissingNhsNumber', 'post16']) {
      if (options?.includes(option)) {
        patients = patients.filter((patient) => patient[option])
      }
    }

    // Clean up session data
    delete data.options
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
    const params = new URLSearchParams()

    // Single value per filter
    for (const key of ['q']) {
      const value = request.body[key]
      if (value) {
        params.append(key, String(value))
      }
    }

    // Multiple values per filter
    for (const key of ['options']) {
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

  archive(request, response) {
    const { data } = request.session
    const { __, patient } = response.locals

    patient.archive(
      {
        ...request.body.patient,
        ...(data.token && { createdBy_uid: data.token?.uid })
      },
      data
    )

    request.flash('success', __(`patient.archive.success`))

    response.redirect(patient.uri)
  }
}
