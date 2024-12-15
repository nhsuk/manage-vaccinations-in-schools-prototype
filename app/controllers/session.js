import { Batch } from '../models/batch.js'
import { ConsentOutcome, Patient, PatientOutcome } from '../models/patient.js'
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

    let sessions = Session.readAll(data)

    if (view === 'active') {
      sessions = sessions.filter((session) => session.isActive)
    } else {
      sessions = sessions.filter((session) => session.status === statuses[view])
    }

    response.render('session/list', { sessions, view })
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`session/${view}`)
  },

  activity(request, response) {
    const { activity } = request.params
    let { tab } = request.query
    const { __, session } = response.locals

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

    response.locals.activity = activity

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

    const session = Session.read(id, data)

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

    response.locals.couldNotVaccinate = Patient.readAll(session)
      .filter(({ consent }) => consent.value !== ConsentOutcome.NoResponse)
      .filter(
        ({ outcome }) => outcome.value === PatientOutcome.CouldNotVaccinate
      )

    response.locals.noResponse = Patient.readAll(session).filter(
      ({ consent }) => consent.value === ConsentOutcome.NoResponse
    )

    response.locals.session = session

    next()
  },

  edit(request, response) {
    const { id } = request.params
    const { data } = request.session
    const { session } = response.locals

    // Setup wizard if not already setup
    if (!Session.read(id, data.wizard)) {
      session.create(session, data.wizard)
    }

    // Show back link to session page
    response.locals.back = session.uri
    response.locals.session = new Session(Session.read(id, data.wizard), data)

    response.render('session/edit')
  },

  update(request, response) {
    const { id } = request.params
    const { data } = request.session
    const { __ } = response.locals

    const session = new Session(Session.read(id, data.wizard), data)
    request.flash('success', __(`session.edit.success`, { session }))

    session.update(session, data)

    // Clean up session data
    delete data.session

    response.redirect(`/sessions/${id}`)
  },

  readForm(request, response, next) {
    const { form, id } = request.params
    const { data } = request.session

    const session = Session.read(id, data.wizard)
    response.locals.session = session

    response.locals.paths = {
      ...(form === 'edit' && {
        back: `${session.uri}/edit`,
        next: `${session.uri}/edit`
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
    const { data } = request.session
    const { paths, session } = response.locals

    session.update(request.body.session, data.wizard)

    response.redirect(paths.next)
  },

  downloadFile(request, response) {
    const { data } = request.session
    const { session } = response.locals

    const { buffer, fileName, mimetype } = session.createFile(data)

    response.header('Content-Type', mimetype)
    response.header('Content-disposition', `attachment; filename=${fileName}`)

    response.end(buffer)
  },

  close(request, response) {
    const { data } = request.session
    const { __, couldNotVaccinate, noResponse, session } = response.locals

    request.flash('success', __(`session.close.success`, { session }))

    // Update session as closed
    session.update({ closed: true }, data)

    // Find a clinic
    const clinic = Session.readAll(data)
      .filter(({ type }) => type === SessionType.Clinic)
      .find(({ programme_pids }) =>
        programme_pids.some((pid) => session.programme_pids.includes(pid))
      )

    // Move patients to clinic
    if (clinic) {
      const patientsToMove = couldNotVaccinate
        .concat(noResponse)
        .map((patient) => patient.nhsn)
      for (const nhsn of patientsToMove) {
        const patient = Patient.read(nhsn, data)
        patient.removeFromSession(session)
        patient.inviteToSession(clinic)
        patient.update({}, data)
      }
    }

    response.redirect(session.uri)
  }
}
