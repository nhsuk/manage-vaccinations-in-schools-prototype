import wizard from '@x-govuk/govuk-prototype-wizard'

import { Batch } from '../models/batch.js'
import { ConsentOutcome, Patient, PatientOutcome } from '../models/patient.js'
import { Programme } from '../models/programme.js'
import { programmeTypes } from '../models/programme.js'
import { Session, SessionStatus, SessionType } from '../models/session.js'

const getPatientsForKey = (patients, activity, tab) => {
  return patients.filter((patient) => {
    // Show FinalRefusal outcome in Refusal tab
    if (tab === 'Refused') {
      return ['Refused', 'FinalRefusal'].includes(patient[activity]?.key)
    }

    return patient[activity]?.key === tab
  })
}

export const sessionController = {
  list(request, response) {
    const view = request.params.view || 'active'
    const { data } = request.session

    const statuses = {
      closed: SessionStatus.Closed,
      completed: SessionStatus.Completed,
      planned: SessionStatus.Planned,
      unplanned: SessionStatus.Unplanned
    }

    let sessions = Object.values(data.sessions).map(
      (session) => new Session(session, data)
    )

    if (view === 'active') {
      sessions = sessions.filter((session) => session.isActive)
    } else {
      sessions = sessions.filter((session) => session.status === statuses[view])
    }

    response.render('session/list', { sessions, view })
  },

  show(request, response) {
    response.render('session/show')
  },

  activity(request, response) {
    const { session } = request.app.locals
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

    response.locals.patients = getPatientsForKey(
      session.patients,
      activity,
      tab
    )
    response.locals.navigationItems = tabs.map((key) => ({
      text: __(`${activity}.${key}.label`),
      count: getPatientsForKey(session.patients, activity, key).length,
      href: `?tab=${key}`,
      current: key === tab
    }))

    response.render('session/activity', { tab })
  },

  read(request, response, next) {
    const { id } = request.params
    const { data } = request.session

    const session = new Session(data.sessions[id], data)

    request.app.locals.session = session
    request.app.locals.programme = new Programme(
      data.programmes[session.programme_pids[0]]
    )

    // Get default batches selected for vaccines in this session
    const defaultBatches = []
    if (data.token?.batch[id]) {
      const sessionBatches = Object.entries(data.token.batch[id])
      if (sessionBatches.length > 0) {
        for (let [, batch_id] of sessionBatches) {
          // Default batch ID may be saved in FormData as an array
          batch_id = Array.isArray(batch_id) ? batch_id.at(-1) : batch_id
          if (batch_id) {
            defaultBatches.push(new Batch(data.batches[batch_id], data))
          }
        }
      }
    }

    response.locals.defaultBatches = defaultBatches

    next()
  },

  edit(request, response) {
    const { session } = request.app.locals
    const { data } = request.session

    request.app.locals.session = new Session(
      {
        ...session, // Previous values
        ...data?.wizard?.session // Wizard values
      },
      data
    )

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

    response.locals.programmePidsItems = Object.values(programmeTypes).map(
      (type) => ({
        text: type.name,
        value: type.pid
      })
    )

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
  },

  readOffline(request, response, next) {
    const { session } = request.app.locals

    response.locals.paths = {
      back: session.uri,
      next: session.uri
    }

    next()
  },

  showOffline(request, response) {
    response.render('session/offline')
  },

  updateOffline(request, response) {
    const { paths } = response.locals

    response.redirect(paths.next)
  },

  readClose(request, response, next) {
    const { patients, session } = request.app.locals

    response.locals.paths = {
      back: session.uri,
      next: session.uri
    }

    response.locals.couldNotVaccinate = patients
      .map((patient) => new Patient(patient))
      .filter(({ consent }) => consent.value !== ConsentOutcome.NoResponse)
      .filter(
        ({ outcome }) => outcome.value === PatientOutcome.CouldNotVaccinate
      )

    response.locals.noResponse = patients
      .map((patient) => new Patient(patient))
      .filter(({ consent }) => consent.value === ConsentOutcome.NoResponse)

    next()
  },

  showClose(request, response) {
    response.render('session/close')
  },

  updateClose(request, response) {
    const { programme, session } = request.app.locals
    const { data } = request.session
    const { __, paths, couldNotVaccinate, noResponse } = response.locals

    const updatedSession = new Session(session)
    updatedSession.closed = true

    // Update session data
    data.sessions[updatedSession.id] = updatedSession

    // Find clinics
    const clinic = Object.values(data.sessions)
      .map((session) => new Session(session, data))
      .filter((session) => session.programme_pids.includes(programme.pid))
      .filter((session) => session.type === SessionType.Clinic)

    // Move patients to clinic
    const patientsToMove = couldNotVaccinate.concat(noResponse)
    for (const patient of patientsToMove) {
      const updatedPatient = new Patient(patient)
      updatedPatient.inviteToSession(clinic[0])

      // Update session data
      data.patients[patient.uuid] = updatedPatient
    }

    request.flash('success', __(`session.success.close`, { session }))

    response.redirect(paths.next)
  }
}
