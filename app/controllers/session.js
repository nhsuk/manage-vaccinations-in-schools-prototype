import { Batch } from '../models/batch.js'
import {
  CaptureOutcome,
  ConsentOutcome,
  PatientOutcome,
  PatientSession,
  TriageOutcome
} from '../models/patient-session.js'
import { Patient } from '../models/patient.js'
import { programmeTypes } from '../models/programme.js'
import { Session, SessionStatus, SessionType } from '../models/session.js'
import { getDateValueDifference } from '../utils/date.js'

const getPatientsForKey = (patients, activity, tab) => {
  return patients.filter((patient) => {
    // Show FinalRefusal outcome in Refusal tab
    if (tab === ConsentOutcome.Refused) {
      return [ConsentOutcome.Refused, ConsentOutcome.FinalRefusal].includes(
        patient[activity]
      )
    }

    return patient[activity] === tab
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

    let sessions = Session.readAll(data).sort((a, b) =>
      getDateValueDifference(a.firstDate, b.firstDate)
    )

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
    const { __, patientSessions } = response.locals

    let tabs = []
    switch (activity) {
      case 'consent':
        tab = tab || ConsentOutcome.NoResponse
        tabs = [
          ConsentOutcome.NoRequest,
          ConsentOutcome.NoResponse,
          ConsentOutcome.Given,
          ConsentOutcome.Refused,
          ConsentOutcome.Inconsistent
        ]
        break
      case 'triage':
        tab = tab || TriageOutcome.Needed
        tabs = [
          TriageOutcome.Needed,
          TriageOutcome.Completed,
          TriageOutcome.NotNeeded
        ]
        break
      case 'capture':
        tab = tab || CaptureOutcome.Register
        tabs = [
          CaptureOutcome.Register,
          CaptureOutcome.GetConsent,
          CaptureOutcome.CheckRefusal,
          CaptureOutcome.NeedsTriage,
          CaptureOutcome.Vaccinate
        ]
        break
      case 'outcome':
        tab = tab || PatientOutcome.Vaccinated
        tabs = [
          PatientOutcome.Vaccinated,
          PatientOutcome.CouldNotVaccinate,
          PatientOutcome.NoOutcomeYet
        ]
        break
    }

    response.locals.activity = activity

    response.locals.patientSessions = getPatientsForKey(
      patientSessions,
      activity,
      tab
    )

    response.locals.navigationItems = tabs.map((key) => ({
      text: __(`${activity}.${key}.label`),
      count: getPatientsForKey(patientSessions, activity, key).length,
      href: `?tab=${key}`,
      current: key === tab
    }))

    response.render('session/activity', { tab })
  },

  read(request, response, next) {
    const { id } = request.params
    const { gtin } = request.query
    const { data } = request.session

    const session = Session.read(id, data)
    const patientSessions = PatientSession.readAll(data).filter(
      ({ session_id }) => session_id === id
    )

    // Used when updating the default batch
    if (gtin) {
      response.locals.batchItems = Batch.readAll(data).filter(
        (batch) => batch.vaccine.gtin === gtin
      )
    }

    response.locals.patientSessions = patientSessions

    response.locals.couldNotVaccinate = patientSessions
      .filter(({ consent }) => consent !== ConsentOutcome.NoResponse)
      .filter(({ outcome }) => outcome === PatientOutcome.CouldNotVaccinate)

    response.locals.noResponse = patientSessions.filter(
      ({ consent }) => consent === ConsentOutcome.NoResponse
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

    // Clean up session data
    delete data.session
    delete data.wizard

    // Update session data
    session.update(session, data)

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
    const { __, couldNotVaccinate, noResponse, patientSession, session } =
      response.locals

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
        patientSession.removeFromSession({
          ...(data.token && { createdBy_uid: data.token?.uid })
        })
        patient.inviteToSession(clinic)
        patient.update({}, data)
      }
    }

    response.redirect(session.uri)
  },

  updateDefaultBatch(request, response) {
    const { data } = request.session
    const { __, session } = response.locals

    // Update session data
    session.update(request.body.session, data)

    // Clean up session date
    delete data.session

    request.flash('success', __('session.defaultBatch.success'))

    response.redirect(`${session.uri}/capture`)
  }
}
