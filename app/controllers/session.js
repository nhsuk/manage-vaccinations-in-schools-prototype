import _ from 'lodash'

import { Batch } from '../models/batch.js'
import {
  Activity,
  ConsentOutcome,
  PatientOutcome,
  ScreenOutcome
} from '../models/patient-session.js'
import { Patient } from '../models/patient.js'
import { programmeTypes } from '../models/programme.js'
import {
  RegistrationOutcome,
  Session,
  SessionStatus,
  SessionType
} from '../models/session.js'
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
    const { hasMissingNhsNumber, snomed, q, yearGroup } = request.query
    const { data } = request.session

    response.locals.view = view

    const session = Session.read(id, data)
    response.locals.session = session

    let results = session.patientSessions

    // Convert year groups query into an array of numbers
    let yearGroups
    if (yearGroup) {
      yearGroups = Array.isArray(yearGroup) ? yearGroup : [yearGroup]
      yearGroups = yearGroups.map((year) => Number(year))
    }

    // Query
    if (q) {
      results = results.filter(({ patient }) =>
        patient.tokenized.includes(String(q).toLowerCase())
      )
    }

    // Filter
    const filters = {
      consent: request.query.consent || 'none',
      screen: request.query.screen || 'none',
      register: request.query.register || 'none',
      record: request.query.record || 'none',
      outcome: request.query.outcome || 'none'
    }

    // Filter by status
    if (filters[view] !== 'none') {
      results = results.filter(
        (patientSession) => patientSession[view] === filters[view]
      )
    }

    // Filter by year group
    if (yearGroup) {
      results = results.filter(({ patient }) =>
        yearGroups.includes(patient.yearGroup)
      )
    }

    // Filter by missing NHS number
    if (hasMissingNhsNumber) {
      results = results.filter(({ patient }) => patient.hasMissingNhsNumber)
    }

    // Remove patient sessions where outcome returns false
    results = results.filter((patientSession) => patientSession[view] !== false)

    // Only show patients ready to vaccinate
    if (view === 'record') {
      results = results.filter(
        ({ nextActivity, register }) =>
          nextActivity === Activity.Record &&
          register === RegistrationOutcome.Present
      )
    }

    // Sort
    results = _.sortBy(results, 'patient.lastName')

    // Ensure MenACWY is the patient session linked to from session activity
    results = results.sort((a, b) =>
      a.programme.name.localeCompare(b.programme.name)
    )

    // Show only one patient session per programme
    results = _.uniqBy(results, 'patient.nhsn')

    // Results
    response.locals.results = getResults(results, request.query)
    response.locals.pages = getPagination(results, request.query)

    // Used when updating the default batch
    if (snomed) {
      response.locals.batchItems = Batch.readAll(data).filter(
        (batch) => batch.vaccine.snomed === snomed
      )
    }

    // Filters
    const statusItems = {
      consent: ConsentOutcome,
      register: RegistrationOutcome
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
      record: VaccinationOutcome,
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
          value: yearGroup,
          checked: yearGroups?.includes(yearGroup)
        })
      )
    }

    // Clean up session data
    delete data.hasMissingNhsNumber
    delete data.q
    delete data.consent
    delete data.screen
    delete data.register
    delete data.outcome

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
    const { hasMissingNhsNumber, yearGroup } = request.body

    const params = new URLSearchParams()
    for (const key of [
      'q',
      'consent',
      'triage',
      'screen',
      'register',
      'record',
      'outcome'
    ]) {
      const param = request.body[key]
      if (param) {
        params.append(key, String(param))
      }
    }

    if (yearGroup) {
      const yearGroups = Array.isArray(yearGroup) ? yearGroup : [yearGroup]
      yearGroups
        .filter((item) => item !== '_unchecked')
        .forEach((year) => {
          params.append('yearGroup', String(year))
        })
    }

    if (hasMissingNhsNumber?.includes('true')) {
      params.append('hasMissingNhsNumber', 'true')
    }

    response.redirect(`/sessions/${id}/${view}?${params}`)
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

    response.render('session/edit')
  },

  update(request, response) {
    const { id } = request.params
    const { data } = request.session
    const { __, session } = response.locals

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

    let session
    if (form === 'edit') {
      session = Session.read(id, data)
    } else {
      session = new Session(Session.read(id, data.wizard), data)
    }

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

    session.update(request.body.session, data)

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
        patient.addToSession(clinic.id)
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
