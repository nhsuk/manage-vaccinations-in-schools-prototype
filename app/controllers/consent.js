import wizard from '@x-govuk/govuk-prototype-wizard'
import _ from 'lodash'

import { generateChild } from '../generators/child.js'
import { generateParent } from '../generators/parent.js'
import { Consent } from '../models/consent.js'
import { Patient } from '../models/patient.js'
import { ProgrammeType } from '../models/programme.js'
import { Reply, ReplyDecision, ReplyRefusal } from '../models/reply.js'
import { School } from '../models/school.js'
import { ConsentWindow, Session, SessionType } from '../models/session.js'
import {
  getHealthQuestionKey,
  getHealthQuestionPaths
} from '../utils/consent.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const consentController = {
  readAll(request, response, next) {
    const { data } = request.session

    const consents = Object.values(data.consents).map(
      (consent) => new Consent(consent, data)
    )
    response.locals.consents = consents

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

    // Delete previous data
    delete data.consent
    delete data?.wizard?.consent

    const consent = new Consent({
      session_id: session.id
    })

    data.wizard = { consent }

    response.redirect(`/consents/${session.id}/${consent.uuid}/new/child`)
  },

  read(request, response, next) {
    const { data } = request.session
    const { id, view } = request.params

    const session = new Session(data.sessions[id], data)

    request.app.locals.session = session

    // Transactional service details
    response.locals.transactionalService = {
      name: 'Give or refuse consent for vaccinations',
      href: `/consents/${id}`
    }
    response.locals.public = true

    // Text and email messages
    if (view === 'emails' || view === 'texts') {
      const child = generateChild()
      const parent = generateParent(child.lastName)

      response.locals.consent = new Consent(
        {
          child,
          parent,
          session_id: session.id
        },
        data
      )
    }

    next()
  },

  show(request, response) {
    const { session } = request.app.locals
    const { view } = request.params

    // Service homepage should show closed message if deadline has passed
    if (!view) {
      return response.render(
        session.consentWindow.value === ConsentWindow.Closed
          ? `consent/closed`
          : `consent/start`
      )
    }

    response.render(`consent/${view}`)
  },

  update(request, response) {
    const { consent } = request.app.locals
    const { id, uuid } = request.params
    const { data } = request.session

    const updatedConsent = new Consent({
      ...consent,
      ...request.body.consent
    })

    data.consents[uuid] = updatedConsent

    response.redirect(`/consents/${id}/confirmation`)
  },

  readForm(request, response, next) {
    const { consent } = request.app.locals
    const { form, id, uuid, view } = request.params
    const { data } = request.session

    const session = new Session(data.sessions[id], data)

    request.app.locals.session = session
    request.app.locals.consent = new Consent(
      {
        ...(form === 'edit' && consent), // Previous values
        ...data?.wizard?.consent // Wizard values,
      },
      data
    )

    const journey = {
      [`/${id}`]: {},
      [`/${id}/${uuid}/${form}/child`]: {},
      [`/${id}/${uuid}/${form}/dob`]: {},
      ...(session.type === SessionType.School
        ? { [`/${id}/${uuid}/${form}/confirm-school`]: {} }
        : {}),
      ...(session.type === SessionType.School && data.confirmSchool !== 'yes'
        ? {
            [`/${id}/${uuid}/${form}/school`]: {}
          }
        : {}),
      [`/${id}/${uuid}/${form}/parent`]: {},
      ...(data.consent?.parent?.tel !== ''
        ? {
            [`/${id}/${uuid}/${form}/contact-preference`]: {}
          }
        : {}),
      [`/${id}/${uuid}/${form}/decision`]: {
        [`${id}/${uuid}/${form}/refusal-reason`]: {
          data: 'consent.decision',
          value: ReplyDecision.Refused
        }
      },
      [`/${id}/${uuid}/${form}/address`]: {},
      ...getHealthQuestionPaths(`/${id}/${uuid}/${form}/`, session.vaccines),
      [`/${id}/${uuid}/${form}/check-answers`]: {},
      [`/${id}/${uuid}/new/confirmation`]: {},
      [`/${id}/${uuid}/${form}/refusal-reason`]: {
        [`/${id}/${uuid}/${form}/refusal-reason-details`]: {
          data: 'consent.refusalReason',
          values: [
            ReplyRefusal.AlreadyGiven,
            ReplyRefusal.GettingElsewhere,
            ReplyRefusal.Medical
          ]
        },
        [`/${id}/${uuid}/${form}/check-answers`]: true
      },
      [`/${id}/${uuid}/${form}/refusal-reason-details`]: {
        [`/${id}/${uuid}/${form}/check-answers`]: true
      },
      [`/${id}/${uuid}/${form}/check-answers`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' &&
        view !== 'check-answers' && {
          back: `/consents/${id}/${uuid}/${form}/check-answers`,
          next: `/consents/${id}/${uuid}/${form}/check-answers`
        })
    }

    response.locals.programmeIsFlu = session.programmes
      .map(({ type }) => type)
      .includes(ProgrammeType.Flu)

    response.locals.programmeItems = session.programmes.map((programme) => ({
      text: programme.name,
      value: programme.pid
    }))

    response.locals.urnItems = Object.values(data.schools)
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
    let { form, view } = request.params
    const key = getHealthQuestionKey(view)
    view = view.startsWith('health-question-') ? 'health-question' : view

    response.render(`consent/form/${view}`, { form, key })
  },

  updateForm(request, response) {
    const { consent } = request.app.locals
    const { data } = request.session
    const { paths } = response.locals

    delete data.confirmSchool
    delete data.healthAnswers

    data.wizard.consent = new Consent({
      ...consent, // Previous values
      ...request.body.consent, // New value
      child: {
        ...consent?.child,
        ...request.body.consent?.child
      },
      parent: {
        ...consent?.parent,
        ...request.body.consent?.parent
      },
      healthAnswers: {
        ...consent?.healthAnswers,
        ...request.body.consent?.healthAnswers
      }
    })

    response.redirect(paths.next)
  },

  showMatch(request, response) {
    const { uuid } = request.params
    let { page, limit } = request.query
    const { data } = request.session

    const consent = new Consent(data.consents[uuid], data)
    let patients = Object.values(data.patients).map(
      (patient) => new Patient(patient)
    )

    // Sort
    patients = _.sortBy(patients, 'lastName')

    // Paginate
    page = parseInt(page) || 1
    limit = parseInt(limit) || 200

    response.locals.consent = consent
    response.locals.patients = patients
    response.locals.results = getResults(patients, page, limit)
    response.locals.pages = getPagination(patients, page, limit)

    response.render('consent/match')
  },

  readLink(request, response, next) {
    const { uuid } = request.params
    const { nhsn } = request.query
    const { data } = request.session

    response.locals.consent = new Consent(data.consents[uuid], data)
    response.locals.patient = Object.values(data.patients)
      .map((patient) => new Patient(patient))
      .find((patient) => patient.nhsn === nhsn)

    next()
  },

  showLink(request, response) {
    response.render('consent/link')
  },

  updateLink(request, response) {
    const { uuid } = request.params
    const { data } = request.session
    const { __, consent, patient } = response.locals

    const updatedPatient = new Patient(patient)
    updatedPatient.addReply(consent)

    // Update session data
    delete data.consents[uuid]

    request.flash(
      'success',
      __(`consent.success.link`, { consent, patient: updatedPatient })
    )

    response.redirect('/consents')
  },

  readAdd(request, response, next) {
    const { uuid } = request.params
    const { data } = request.session

    response.locals.consent = new Reply(data.consents[uuid], data)

    next()
  },

  showAdd(request, response) {
    response.render('consent/add')
  },

  updateAdd(request, response) {
    const { uuid } = request.params
    const { data } = request.session
    const { __, consent } = response.locals

    let patient = Object.values(data.patients).find(
      ({ nhsn }) => nhsn === consent.child.nhsn
    )

    patient = new Patient(patient)
    patient.addReply(consent)

    // Update session data
    delete data.consents[uuid]

    request.flash('success', __(`consent.success.add`, { consent, patient }))

    response.redirect('/consents')
  }
}
