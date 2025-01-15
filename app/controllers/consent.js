import _ from 'lodash'

import { Consent } from '../models/consent.js'
import { PatientSession } from '../models/patient-session.js'
import { Patient } from '../models/patient.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const consentController = {
  readAll(request, response, next) {
    let { page, limit } = request.query
    const { data } = request.session

    let consents = Consent.readAll(data)

    // Sort
    consents = _.sortBy(consents, 'createdAt')

    // Paginate
    page = parseInt(page) || 1
    limit = parseInt(limit) || 100

    response.locals.consents = consents
    response.locals.results = getResults(consents, page, limit)
    response.locals.pages = getPagination(consents, page, limit)

    next()
  },

  showAll(request, response) {
    response.render('consent/list')
  },

  read(request, response, next) {
    const { uuid } = request.params
    const { nhsn } = request.query
    const { data } = request.session

    response.locals.consent = Consent.read(uuid, data)
    response.locals.patient = Patient.read(nhsn, data)

    next()
  },

  show(request, response) {
    const { uuid } = request.params
    const view = request.params.view || 'show'

    if (view === 'invalidate') {
      response.locals.back = `/consents`
    }

    if (view === 'link') {
      response.locals.back = `/consents/${uuid}/match`
    }

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
    const { __, consent, patient } = response.locals

    // Link consent with patient record
    consent.linkToPatient(patient, data)

    request.flash('success', __(`consent.link.success`, { consent, patient }))

    response.redirect('/consents')
  },

  add(request, response) {
    const { data } = request.session
    const { __, consent } = response.locals

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

    response.redirect('/consents')
  },

  invalidate(request, response) {
    const { note } = request.body.consent
    const { data } = request.session
    const { __, consent } = response.locals

    consent.update({ invalid: true, note }, data)

    // Clean up session data
    delete data.consent

    request.flash('success', __(`consent.invalidate.success`, { consent }))

    response.redirect('/consents')
  }
}
