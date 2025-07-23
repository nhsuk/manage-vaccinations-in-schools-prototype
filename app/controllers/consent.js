import _ from 'lodash'

import { Consent } from '../models/consent.js'
import { PatientSession } from '../models/patient-session.js'
import { Patient } from '../models/patient.js'
import { Session } from '../models/session.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const consentController = {
  read(request, response, next, consent_uuid) {
    const { session_id } = request.params
    const { nhsn } = request.query
    const { referrer } = request.session

    const consent = Consent.read(consent_uuid, request.session.data)
    const back = session_id
      ? `/sessions/${consent.session_id}/consents`
      : '/consents'

    response.locals.back = referrer || back
    response.locals.consent = consent
    response.locals.patient = Patient.read(nhsn, request.session.data)
    response.locals.consentPath = session_id
      ? `/sessions/${consent.session_id}${consent.uri}`
      : consent.uri

    delete request.session.referrer

    next()
  },

  readAll(request, response, next) {
    const { session_id } = request.params
    let consents = Consent.readAll(request.session.data)

    // Sort
    consents = _.sortBy(consents, 'createdAt')

    // Session consents
    if (session_id) {
      const session = Session.read(session_id, request.session.data)
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

    response.locals.patients = patients
    response.locals.results = getResults(patients, page, limit)
    response.locals.pages = getPagination(patients, request.query)

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
    const { data } = request.session
    const { __, consent, patient, consentsPath } = response.locals

    // Link consent with patient record
    consent.linkToPatient(patient, data)

    request.flash('success', __(`consent.link.success`, { consent, patient }))

    response.redirect(consentsPath)
  },

  add(request, response) {
    const { data } = request.session
    const { __, consent, consentsPath } = response.locals

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
    patient.inviteToSession(patientSession.session)

    // Link consent with patient record
    consent.linkToPatient(patient, data)

    request.flash('success', __(`consent.add.success`, { consent, patient }))

    response.redirect(consentsPath)
  },

  invalidate(request, response) {
    const { note } = request.body.consent
    const { data } = request.session
    const { __, consent, consentsPath } = response.locals

    consent.update({ invalid: true, note }, data)

    // Clean up session data
    delete data.consent

    request.flash('success', __(`consent.invalidate.success`, { consent }))

    response.redirect(consentsPath)
  }
}
