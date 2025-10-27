import _ from 'lodash'

import { AcademicYear, ArchiveRecordReason } from '../enums.js'
import { Patient } from '../models/patient.js'
import { Programme } from '../models/programme.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const patientController = {
  read(request, response, next, patient_uuid) {
    const { data } = request.session
    const { __ } = response.locals

    const patient = Patient.findOne(patient_uuid, data)

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
    let { options, programme_ids, q } = request.query
    const { data } = request.session

    const latestAcademicYear = Object.values(AcademicYear).at(-1)
    const programmes = Programme.findAll(data)
      .filter((programme) => programme.year === latestAcademicYear)
      .sort((a, b) => a.name.localeCompare(b.name))

    const patients = Patient.findAll(data)

    // Sort
    let results = _.sortBy(patients, 'lastName')

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

    // Filter by outcome
    for (const name of ['consent', 'screen', 'report']) {
      const outcome = request.query[name]
      if (outcome && outcome !== 'none' && programme_ids) {
        results = results.filter((patient) =>
          patient.patientSessions.some(
            (patientSession) =>
              patientSession[name] === outcome &&
              programme_ids.includes(patientSession.programme_id)
          )
        )
      }
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
    response.locals.patients = patients
    response.locals.results = getResults(results, request.query)
    response.locals.pages = getPagination(results, request.query)

    // Programme filter options
    response.locals.programmeItems = programmes.map((programme) => ({
      text: programme.name,
      value: programme.id,
      checked: programme_ids?.includes(programme.id)
    }))

    // Clean up session data
    delete data.consent
    delete data.screen
    delete data.report
    delete data.options
    delete data.programme_ids
    delete data.q

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

    // Radios and text inputs
    for (const key of ['consent', 'q', 'report', 'screen']) {
      const value = request.body[key]
      if (value) {
        params.append(key, String(value))
      }
    }

    // Checkboxes
    for (const key of ['options', 'programme_ids']) {
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
    const { patient_uuid } = request.params
    const { data, referrer } = request.session

    // Setup wizard if not already setup
    let patient = Patient.findOne(patient_uuid, data.wizard)
    if (!patient) {
      patient = Patient.create(response.locals.patient, data.wizard)
    }

    response.locals.patient = new Patient(patient, data)

    // Show back link to referring page, else patient page
    response.locals.back = referrer || patient.uri

    response.render('patient/edit')
  },

  update(request, response) {
    const { patient_uuid } = request.params
    const { data, referrer } = request.session
    const { __ } = response.locals

    // Update session data
    const patient = Patient.update(
      patient_uuid,
      data.wizard.patients[patient_uuid],
      data
    )

    // Clean up session data
    delete data.patient
    delete data.wizard

    request.flash('success', __('patient.edit.success'))

    response.redirect(referrer || patient.uri)
  },

  readForm(request, response, next) {
    const { patient_uuid } = request.params
    const { data } = request.session
    let { patient } = response.locals

    // Setup wizard if not already setup
    if (!Patient.findOne(patient_uuid, data.wizard)) {
      patient = Patient.create(patient, data.wizard)
    }

    response.locals.patient = new Patient(patient, data)

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
    const { patient_uuid } = request.params
    const { data } = request.session
    const { paths } = response.locals

    Patient.update(patient_uuid, request.body.patient, data.wizard)

    response.redirect(paths.next)
  },

  archive(request, response) {
    const { account } = request.app.locals
    const { patient_uuid } = request.params
    const { data } = request.session
    const { __ } = response.locals

    const patient = Patient.archive(
      patient_uuid,
      {
        createdBy_uid: account.uid,
        ...request.body.patient
      },
      data
    )

    request.flash('success', __(`patient.archive.success`))

    response.redirect(patient.uri)
  }
}
