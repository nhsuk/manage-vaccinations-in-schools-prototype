import _ from 'lodash'

import { Consent } from '../models/consent.js'
import { PatientSession } from '../models/patient-session.js'
import { Patient } from '../models/patient.js'
import { Session } from '../models/session.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const consentController = {
  read(request, response, next, consent_uuid) {
    const { patient_uuid } = request.query
    const { session_id } = request.params
    const { referrer } = request.session

    const consent = Consent.findOne(consent_uuid, request.session.data)
    const back = session_id
      ? `/sessions/${consent.session_id}/consents`
      : '/consents'

    response.locals.back = referrer || back
    response.locals.consent = consent
    response.locals.patient = Patient.findOne(
      patient_uuid,
      request.session.data
    )
    response.locals.consentPath = session_id
      ? `/sessions/${consent.session_id}${consent.uri}`
      : consent.uri
    response.locals.consentsPath = session_id
      ? `/sessions/${session_id}/consents`
      : '/consents'

    delete request.session.referrer

    next()
  },

  readAll(request, response, next) {
    const { session_id } = request.params
    let consents = Consent.findAll(request.session.data)

    // Sort
    consents = _.sortBy(consents, 'createdAt')

    // Session consents
    if (session_id) {
      const session = Session.findOne(session_id, request.session.data)
      consents = session.consents
      response.locals.session = session
    }

    response.locals.consents = consents
    response.locals.consentsPath = session_id
      ? `/sessions/${session_id}/consents`
      : '/consents'
    response.locals.results = getResults(consents, request.query)
    response.locals.pages = getPagination(consents, request.query)

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`consent/${view}`)
  },

  list(request, response) {
    response.render('consent/list')
  },

  readMatches(request, response, next) {
    let { hasMissingNhsNumber, page, limit, q } = request.query
    const { data } = request.session

    let patients = Patient.findAll(data)

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

    // Toggle initial view
    response.locals.initial =
      Object.keys(request.query).filter((key) => key !== 'referrer').length ===
      0

    // Results
    response.locals.patients = patients
    response.locals.results = getResults(patients, page, limit)
    response.locals.pages = getPagination(patients, request.query)

    // Clean up session data
    delete data.hasMissingNhsNumber
    delete data.q

    next()
  },

  filterMatches(request, response) {
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
    const { consent_uuid } = request.params
    const { data } = request.session
    const { __, consent, patient, consentsPath } = response.locals

    // Link consent with patient record
    consent.linkToPatient(patient)

    // Update session data
    Consent.update(consent_uuid, consent, data)
    Patient.update(patient.uuid, patient, data)

    request.flash('success', __(`consent.link.success`, { consent, patient }))

    response.redirect(consentsPath)
  },

  add(request, response) {
    const { consent_uuid } = request.params
    const { data } = request.session
    const { __, consent, consentsPath } = response.locals

    // Create patient
    const patient = Patient.create(consent.child, data)

    // TODO: Select for cohort
    // Get programmes from session
    // Get cohorts for programmes
    // Find cohort that matches child’s year group

    // Create and add patient session
    const patientSession = PatientSession.create(
      {
        patient_uuid: patient.uuid,
        session_id: consent.session_id
      },
      data
    )

    // Add to session
    patient.addToSession(patientSession)

    // Invite parent to give consent
    const session = Session.findOne(patientSession.session_id, data)
    patient.inviteToSession(session)

    // Link consent with patient record
    consent.linkToPatient(patient)

    // Update session data
    Consent.update(consent_uuid, consent, data)
    Patient.update(patient.uuid, patient, data)

    request.flash('success', __(`consent.add.success`, { consent, patient }))

    response.redirect(consentsPath)
  },

  invalidate(request, response) {
    const { note } = request.body.consent
    const { consent_uuid } = request.params
    const { data } = request.session
    const { __, consentsPath } = response.locals

    // Clean up session data
    delete data.consent

    // Update session data
    const consent = Consent.update(consent_uuid, { invalid: true, note }, data)

    request.flash('success', __(`consent.invalidate.success`, { consent }))

    response.redirect(consentsPath)
  }
}
