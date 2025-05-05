import _ from 'lodash'

import { Consent } from '../models/consent.js'
import { PatientSession } from '../models/patient-session.js'
import { Patient } from '../models/patient.js'
import { Session } from '../models/session.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const consentController = {
  readAll(request, response, next) {
    const { id } = request.params
    const { data } = request.session

    let consents = Consent.readAll(data)

    // Sort
    consents = _.sortBy(consents, 'createdAt')

    // Session consents
    if (id) {
      const session = Session.read(id, data)
      consents = session.consents
      response.locals.session = session
    }

    response.locals.consents = consents
    response.locals.results = getResults(consents, request.query)
    response.locals.pages = getPagination(consents, request.query)
    response.locals.rootPath = id ? `/sessions/${id}/consents` : '/consents'

    next()
  },

  showAll(request, response) {
    response.render('consent/list')
  },

  read(request, response, next) {
    const { id, uuid } = request.params
    const { nhsn } = request.query
    const { data, referrer } = request.session

    const back = id ? `/sessions/${id}/consents` : ''
    const consent = Consent.read(uuid, data)

    response.locals.back = referrer || back
    response.locals.consent = consent
    response.locals.patient = Patient.read(nhsn, data)
    response.locals.consentPath = id
      ? `/sessions/${id}${consent.uri}`
      : consent.uri

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`consent/${view}`)
  },

  edit(request, response) {
    response.render('consent/edit')
  },

  new(request, response) {
    const { session } = request.app.locals
    const { data } = request.session

    const consent = new Consent({
      session_id: session.id
    })

    consent.create(consent, data.wizard)

    response.redirect(`${consent.uri}/new/child`)
  },

  readMatches(request, response, next) {
    const { uuid } = request.params
    let { hasMissingNhsNumber, page, limit, q } = request.query
    const { data } = request.session

    let patients = Patient.readAll(data)

    // Sort
    patients = _.sortBy(patients, 'lastName')

    // Paginate
    page = parseInt(page) || 1
    limit = parseInt(limit) || 50

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

    response.locals.consent = Consent.read(uuid, data)
    response.locals.patients = patients
    response.locals.results = getResults(patients, page, limit)
    response.locals.pages = getPagination(patients, request.query)

    next()
  },

  updateMatches(request, response) {
    const { hasMissingNhsNumber, q } = request.body
    const { consent } = response.locals
    const params = new URLSearchParams()

    if (q) {
      params.append('q', String(q))
    }

    if (hasMissingNhsNumber?.includes('true')) {
      params.append('hasMissingNhsNumber', 'true')
    }

    response.redirect(`${consent.uri}/match?${params}`)
  },

  link(request, response) {
    const { data } = request.session
    const { __, consent, patient, rootPath } = response.locals

    // Link consent with patient record
    consent.linkToPatient(patient, data)

    request.flash('success', __(`consent.link.success`, { consent, patient }))

    response.redirect(rootPath)
  },

  add(request, response) {
    const { data } = request.session
    const { __, consent, rootPath } = response.locals

    // Create and add patient
    const patient = new Patient(consent.child)
    patient.create(patient, data)

    // TODO: Select for cohort
    // Get programmes from session
    // Get cohorts for programmes
    // Find cohort that matches child’s year group

    // Create and add patient session
    const patientSession = new PatientSession(
      {
        patient_uuid: patient.uuid,
        session_id: consent.session_id
      },
      data
    )
    patientSession.create(patientSession, data)

    // Add to session
    patient.addToSession(patientSession)

    // Invite parent to give consent
    patient.inviteToSession(patientSession)

    // Link consent with patient record
    consent.linkToPatient(patient, data)

    request.flash('success', __(`consent.add.success`, { consent, patient }))

    response.redirect(rootPath)
  },

  invalidate(request, response) {
    const { note } = request.body.consent
    const { data } = request.session
    const { __, consent, rootPath } = response.locals

    consent.update({ invalid: true, note }, data)

    // Clean up session data
    delete data.consent

    request.flash('success', __(`consent.invalidate.success`, { consent }))

    response.redirect(rootPath)
  }
}
