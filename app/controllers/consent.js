import _ from 'lodash'

import { Consent } from '../models/consent.js'
import { Patient } from '../models/patient.js'
import { Session } from '../models/session.js'
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

  showMatch(request, response) {
    const { uuid } = request.params
    let { page, limit } = request.query
    const { data } = request.session

    let patients = Patient.readAll(data)

    // Sort
    patients = _.sortBy(patients, 'lastName')

    // Paginate
    page = parseInt(page) || 1
    limit = parseInt(limit) || 200

    response.locals.consent = Consent.read(uuid, data)
    response.locals.patients = patients
    response.locals.results = getResults(patients, page, limit)
    response.locals.pages = getPagination(patients, page, limit)

    response.render('consent/match')
  },

  readLink(request, response, next) {
    const { uuid } = request.params
    const { nhsn } = request.query
    const { data } = request.session

    const consent = Consent.read(uuid, data)
    response.locals.consent = consent

    response.locals.patient = Patient.read(nhsn, data)

    response.locals.back = `/consents/${uuid}/match`

    next()
  },

  showLink(request, response) {
    response.render('consent/link')
  },

  updateLink(request, response) {
    const { data } = request.session
    const { __, consent, patient } = response.locals

    // Link consent with patient record
    consent.linkToPatient(patient, data)

    request.flash('success', __(`consent.link.success`, { consent, patient }))

    response.redirect('/consents')
  },

  readAdd(request, response, next) {
    const { uuid } = request.params
    const { data } = request.session

    response.locals.consent = Consent.read(uuid, data)

    next()
  },

  showAdd(request, response) {
    response.render('consent/add')
  },

  updateAdd(request, response) {
    const { data } = request.session
    const { __, consent } = response.locals

    // Create patient
    const patient = new Patient(consent.child)

    // TODO: Select for cohort
    // Get programmes from session
    // Get cohorts for programmes
    // Find cohort that matches child’s year group

    // Invite to session
    const session = new Session(data.sessions[consent.session_id], data)
    patient.inviteToSession(session)

    // Link consent with patient record
    consent.linkToPatient(patient, data)

    request.flash('success', __(`consent.add.success`, { consent, patient }))

    response.redirect('/consents')
  }
}
