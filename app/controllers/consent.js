import _ from 'lodash'

import { Consent } from '../models/consent.js'
import { PatientSession } from '../models/patient-session.js'
import { Patient } from '../models/patient.js'
import { Session } from '../models/session.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const consentController = {
  readAll(request, response, next) {
    const { id } = request.params
    let { page, limit } = request.query
    const { data } = request.session

    let consents = Consent.readAll(data)

    // Sort
    consents = _.sortBy(consents, 'createdAt')

    // Paginate
    page = parseInt(page) || 1
    limit = parseInt(limit) || 100

    // Session consents
    if (id) {
      const session = Session.read(id, data)
      consents = session.consents
      response.locals.session = session
    }

    response.locals.consents = consents
    response.locals.results = getResults(consents, page, limit)
    response.locals.pages = getPagination(consents, page, limit)
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
    let { page, limit, q } = request.query
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

    // Clean up session data
    delete data.q

    response.locals.consent = Consent.read(uuid, data)
    response.locals.patients = patients
    response.locals.results = getResults(patients, page, limit)
    response.locals.pages = getPagination(patients, page, limit)

    next()
  },

  updateMatches(request, response) {
    const { q } = request.body
    const { consent } = response.locals

    // Update query
    const params = {}
    if (q) {
      params.q = String(q)
    }

    // @ts-ignore
    const queryString = new URLSearchParams(params).toString()

    response.redirect(`${consent.uri}/match?${queryString}`)
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

    // Invite to session
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
