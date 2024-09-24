import { wizard } from 'nhsuk-prototype-rig'
import { Batch } from '../models/batch.js'
import { Consent } from '../models/consent.js'
import { Patient } from '../models/patient.js'
import { Reply } from '../models/reply.js'
import { School } from '../models/school.js'
import { Session, SessionStatus } from '../models/session.js'

export const sessionController = {
  list(request, response) {
    const view = request.params.view || 'active'
    const { data } = request.session

    const statuses = {
      active: SessionStatus.Active,
      completed: SessionStatus.Completed,
      planned: SessionStatus.Planned,
      unplanned: SessionStatus.Unplanned
    }

    response.render('session/list', {
      sessions: Object.values(data.sessions)
        .map((session) => {
          session = new Session(session)
          session.patients = Object.values(data.patients).filter(
            (patient) => patient.session_id === session.id
          )
          return session
        })
        .filter((session) => session.status === statuses[view]),
      view
    })
  },

  show(request, response) {
    response.render('session/show')
  },

  activity(request, response) {
    const { patients } = request.app.locals
    const { activity } = request.params
    let { tab } = request.query
    const { __ } = response.locals

    let tabs = []
    switch (activity) {
      case 'consent':
        tab = tab || 'NoResponse'
        tabs = ['NoResponse', 'Given', 'Refused', 'Inconsistent']
        break
      case 'triage':
        tab = tab || 'Needed'
        tabs = ['Needed', 'Completed', 'NotNeeded']
        break
      case 'capture':
        tab = tab || 'Register'
        tabs = [
          'Register',
          'GetConsent',
          'CheckRefusal',
          'NeedsTriage',
          'Vaccinate'
        ]
        break
      case 'outcome':
        tab = tab || 'Vaccinated'
        tabs = ['Vaccinated', 'CouldNotVaccinate', 'NoOutcomeYet']
        break
    }

    request.app.locals.activity = activity

    response.locals.navigationItems = tabs.map((key) => ({
      text: __(`${activity}.${key}.label`),
      count: patients.filter((patient) => patient[activity]?.key === key)
        .length,
      href: `?tab=${key}`,
      current: key === tab
    }))

    response.render('session/activity', {
      patients: patients.filter((patient) => patient[activity]?.key === tab),
      allPatients: patients,
      tab
    })
  },

  showConsents(request, response) {
    const { session } = request.app.locals

    response.locals.consents = Object.values(session.consents).map(
      (consent) => new Consent(consent)
    )

    response.render('session/consents')
  },

  showConsentMatch(request, response) {
    const { session } = request.app.locals
    const { uuid } = request.params

    request.app.locals.consent = new Consent(session.consents[uuid])

    response.render('session/consent-match')
  },

  showConsentLink(request, response) {
    const { patients } = request.app.locals
    const { nhsn } = request.query

    response.locals.patient = new Patient(
      patients.find((patient) => patient.nhsn === nhsn)
    )

    response.render('session/consent-link')
  },

  updateConsentLink(request, response) {
    const { patients, session } = request.app.locals
    const { uuid } = request.params
    const { nhsn } = request.query
    const { __ } = response.locals

    // Add consent response to patient record
    const consent = session.consents[uuid]
    const patient = new Patient(
      patients.find((patient) => patient.nhsn === nhsn)
    )
    patient.respond = new Reply(consent)

    // Remove unmatched consent response
    delete session.consents[uuid]

    request.flash('success', __(`session.success.link`, { consent, patient }))

    response.redirect(`${session.uri}/consents`)
  },

  showConsentAdd(request, response) {
    const { session } = request.app.locals
    const { uuid } = request.params

    request.app.locals.consent = new Reply(session.consents[uuid])

    response.render('session/consent-add')
  },

  updateConsentAdd(request, response) {
    const { consent, patients, session } = request.app.locals
    const { uuid } = request.params
    const { __ } = response.locals

    const patient = new Patient(
      patients.find((patient) => patient.nhsn === consent.child.nhsn)
    )

    patient.respond = new Reply(consent)

    // Remove unmatched consent response
    delete session.consents[uuid]

    request.flash('success', __(`session.success.add`, { consent, patient }))

    response.redirect(`${session.uri}/consents`)
  },

  read(request, response, next) {
    const { id } = request.params
    const { data } = request.session

    const session = new Session(data.sessions[id])

    request.app.locals.session = session
    request.app.locals.patients = Object.values(data.patients)
      .filter((patient) => patient.session_id === id)
      .map((patient) => new Patient(patient))

    // Get default batches selected for vaccines in this session
    const defaultBatches = []
    if (data.token?.batch[id]) {
      const sessionBatches = Object.entries(data.token.batch[id])
      if (sessionBatches.length > 0) {
        for (let [_gtin, batch_id] of sessionBatches) {
          // Default batch ID may be saved in FormData as an array
          batch_id = Array.isArray(batch_id) ? batch_id.at(-1) : batch_id
          defaultBatches.push(new Batch(data.batches[batch_id]))
        }
      }
    }

    response.locals.defaultBatches = defaultBatches

    next()
  },

  edit(request, response) {
    const { session } = request.app.locals
    const { data } = request.session

    request.app.locals.session = new Session({
      ...session, // Previous values
      ...data?.wizard?.session // Wizard values
    })

    response.render('session/edit')
  },

  new(request, response) {
    const { data } = request.session

    // Delete previous data
    delete data.session
    delete data?.wizard?.session

    const session = new Session()

    data.wizard = { session }

    response.redirect(`/sessions/${session.id}/new/programmes`)
  },

  update(request, response) {
    const { session } = request.app.locals
    const { form, id } = request.params
    const { data } = request.session
    const { __ } = response.locals

    data.sessions[id] = new Session({
      ...session, // Previous values
      ...data?.wizard?.session, // Wizard values
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    delete data?.wizard?.session

    const action = form === 'edit' ? 'update' : 'create'
    request.flash('success', __(`session.success.${action}`, { session }))

    response.redirect(`/sessions/${id}`)
  },

  readForm(request, response, next) {
    const { session } = request.app.locals
    const { form, id } = request.params
    const { data } = request.session

    request.app.locals.session = new Session({
      ...(form === 'edit' && session), // Previous values
      ...data?.wizard?.session // Wizard values,
    })

    const journey = {
      [`/`]: {},
      [`/${id}/${form}/programmes`]: {},
      [`/${id}/${form}/dates`]: {},
      [`/${id}/${form}/schedule`]: {},
      [`/${id}/${form}/check-answers`]: {},
      [`/${id}`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' && {
        back: `/sessions/${id}/edit`,
        next: `/sessions/${id}/edit`
      })
    }

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`session/form/${view}`)
  },

  updateForm(request, response) {
    const { session } = request.app.locals
    const { data } = request.session
    const { paths } = response.locals

    data.wizard.session = new Session({
      ...session, // Previous values
      ...request.body.session // New value
    })

    response.redirect(paths.next)
  }
}
