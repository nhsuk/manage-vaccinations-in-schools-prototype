import _ from 'lodash'

import { Batch } from '../models/batch.js'
import { Consent } from '../models/consent.js'
import {
  ConsentOutcome,
  PatientOutcome,
  RegistrationOutcome,
  ScreenOutcome,
  TriageOutcome
} from '../models/patient-session.js'
import { Patient } from '../models/patient.js'
import { programmeTypes } from '../models/programme.js'
import { Session, SessionStatus, SessionType } from '../models/session.js'
import { VaccinationOutcome } from '../models/vaccination.js'
import { getDateValueDifference } from '../utils/date.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { formatYearGroup } from '../utils/string.js'

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

  read(request, response, next) {
    const { id, view } = request.params
    let { page, limit, gtin, q } = request.query
    const { data } = request.session

    response.locals.view = view

    const session = Session.read(id, data)
    response.locals.session = session

    let patientSessions = session.patientSessions

    // Paginate
    page = parseInt(page) || 1
    limit = parseInt(limit) || 200

    // Query
    if (q) {
      patientSessions = session.patientSessions.filter(({ patient }) =>
        patient.tokenized.includes(String(q).toLowerCase())
      )
    }

    // Filter
    const filters = {
      pid: request.query.pid || session.programmes[0].pid,
      consent: request.query.consent || 'none',
      screen: request.query.screen || 'none',
      register: request.query.register || 'none',
      record: request.query.record || 'none',
      outcome: request.query.outcome || 'none'
    }

    // Filter by programme
    patientSessions = patientSessions.filter(
      ({ programme_pid }) => programme_pid === filters.pid
    )

    // Filter by status
    if (filters[view] !== 'none') {
      patientSessions = patientSessions.filter(
        (patientSession) => patientSession[view] === filters[view]
      )
    }

    // Remove patient sessions where outcome returns false
    patientSessions = patientSessions.filter(
      (patientSession) => patientSession[view] !== false
    )

    // Sort
    patientSessions = _.sortBy(patientSessions, 'patient.firstName')

    // Results
    response.locals.patientSessions = patientSessions
    response.locals.results = getResults(patientSessions, page, limit)
    response.locals.pages = getPagination(patientSessions, page, limit)

    // Used when updating the default batch
    if (gtin) {
      response.locals.batchItems = Batch.readAll(data).filter(
        (batch) => batch.vaccine.gtin === gtin
      )
    }

    // Filters
    if (session.programmes.length > 1) {
      response.locals.programmeItems = session.programmes.map((programme) => ({
        text: programme.name,
        value: programme.pid,
        checked: programme.pid === filters.pid
      }))
    }

    const statusItems = {
      consent: ConsentOutcome,
      triage: TriageOutcome,
      register: RegistrationOutcome,
      record: VaccinationOutcome
    }

    if (statusItems[view]) {
      response.locals.statusItems = [
        {
          text: 'All',
          value: 'none',
          checked: filters[view] === 'none'
        },
        ...Object.values(statusItems[view]).map((value) => ({
          text: value,
          value,
          checked: value === filters[view]
        }))
      ]
    }

    const outcomeItems = {
      screen: ScreenOutcome,
      outcome: PatientOutcome
    }

    if (outcomeItems[view]) {
      response.locals.statusItems = [
        {
          text: 'All',
          value: 'none',
          checked: filters[view] === 'none'
        },
        ...Object.values(outcomeItems[view]).map((value) => ({
          text: value,
          value,
          checked: value === filters[view]
        }))
      ]
    }

    if (session.school) {
      response.locals.yearGroupItems = session.school.yearGroups.map(
        (yearGroup) => ({
          text: formatYearGroup(yearGroup),
          value: yearGroup
        })
      )
    }

    // Clean up session data
    delete data.hasMissingNhsNumber
    delete data.q

    next()
  },

  show(request, response) {
    let { view } = request.params

    if (['consent', 'screen', 'register', 'record', 'outcome'].includes(view)) {
      view = 'activity'
    } else if (!view) {
      view = 'show'
    }

    response.render(`session/${view}`)
  },

  search(request, response) {
    const { id, view } = request.params

    const params = {}
    for (const key of [
      'q',
      'pid',
      'consent',
      'triage',
      'screen',
      'register',
      'record',
      'outcome'
    ]) {
      const param = request.body[key]
      if (param) {
        params[key] = String(param)
      }
    }

    // @ts-ignore
    const queryString = new URLSearchParams(params).toString()

    response.redirect(`/sessions/${id}/${view}?${queryString}`)
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
    const { __, session } = response.locals

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
      const patientSessionsForClinic = session.patientSessionsForClinic.map(
        (patient) => patient.nhsn
      )
      for (const patientSession of patientSessionsForClinic) {
        const patient = Patient.read(patientSession.patient.nhsn, data)
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

    response.redirect(`${session.uri}/record`)
  }
}
