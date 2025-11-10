import wizard from '@x-govuk/govuk-prototype-wizard'
import _ from 'lodash'

import {
  AcademicYear,
  Activity,
  ConsentOutcome,
  InstructionOutcome,
  ProgrammeOutcome,
  RegistrationOutcome,
  ScreenOutcome,
  SessionType,
  VaccineCriteria,
  VaccineMethod
} from '../enums.js'
import { Clinic } from '../models/clinic.js'
import { DefaultBatch } from '../models/default-batch.js'
import { Instruction } from '../models/instruction.js'
import { Organisation } from '../models/organisation.js'
import { PatientSession } from '../models/patient-session.js'
import { Patient } from '../models/patient.js'
import { Session } from '../models/session.js'
import { getDateValueDifference } from '../utils/date.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { formatYearGroup } from '../utils/string.js'

export const sessionController = {
  read(request, response, next, session_id) {
    const { data } = request.session

    const session = Session.findOne(session_id, data)
    response.locals.session = session

    response.locals.defaultBatches = DefaultBatch.findAll(data).filter(
      (defaultBatch) => defaultBatch.session_id === session_id
    )

    next()
  },

  readAll(request, response, next) {
    response.locals.sessions = Session.findAll(request.session.data)

    next()
  },

  show(request, response) {
    let { view } = request.params

    if (
      [
        'consent',
        'screen',
        'instruct',
        'register',
        'record',
        'report'
      ].includes(view)
    ) {
      view = 'activity'
    } else if (!view) {
      view = 'show'
    }

    response.render(`session/${view}`)
  },

  new(request, response) {
    const { account } = request.app.locals
    const { data } = request.session

    const session = Session.create(
      {
        // TODO: This needs contextual organisation data to work
        registration: data.organisation.sessionRegistration,
        createdBy_uid: account.uid
      },
      data.wizard
    )

    response.redirect(`${session.uri}/new/type`)
  },

  list(request, response) {
    const { programme_ids, q } = request.query
    const { data } = request.session
    const { __, sessions } = response.locals
    const { currentAcademicYear, isRollover } = response.app.locals

    let results = sessions

    // Query
    if (q) {
      results = results.filter((session) =>
        session.tokenized.includes(String(q).toLowerCase())
      )
    }

    // Filter defaults
    const filters = {
      academicYear: request.query?.academicYear || currentAcademicYear,
      status: request.query?.status || 'none',
      type: request.query?.type || 'none'
    }

    // Filter by academic year
    results = results.filter(
      ({ academicYear }) => academicYear === filters.academicYear
    )

    // Filter by programme
    if (programme_ids) {
      results = results.filter((session) =>
        session.programme_ids.some((id) => programme_ids.includes(id))
      )
    }

    // Filter by status
    if (filters.status !== 'none') {
      results = results.filter((session) => session[filters.status])
    }

    // Filter by type
    if (filters.type !== 'none') {
      results = results.filter(({ type }) => type === filters.type)
    }

    // Sort
    results = results.sort((a, b) =>
      getDateValueDifference(b.firstDate, a.firstDate)
    )

    // Results
    response.locals.results = getResults(results, request.query, 40)
    response.locals.pages = getPagination(results, request.query, 40)

    // Academic year options
    response.locals.academicYearItems =
      isRollover &&
      Object.values(AcademicYear)
        .slice(-2)
        .map((value) => ({
          text: value,
          value,
          checked: filters.academicYear === value
        }))

    const programmesMap = new Map()
    sessions
      .filter((session) => session.academicYear === filters.academicYear)
      .flatMap((session) => session.programmes || [])
      .forEach((programme) => {
        programmesMap.set(programme.id, programme)
      })

    const programmes = [...programmesMap.values()]

    // Programme filter options
    if (programmes.length > 1) {
      response.locals.programmeItems = programmes
        .map((programme) => ({
          text: programme.name,
          value: programme.id,
          checked: programme_ids?.includes(programme.id)
        }))
        .sort((a, b) => a.text.localeCompare(b.text))
    }

    // Status filter options
    response.locals.statusItems = [
      {
        text: 'Any',
        value: 'none',
        checked: !filters.status || filters.status === 'none'
      },
      ...Object.values([
        'isActive',
        'isUnplanned',
        'isPlanned',
        'isCompleted',
        'isClosed'
      ]).map((value) => ({
        text: __(`session.${value}.label`),
        value,
        checked: filters.status === value
      }))
    ]

    // Type filter options
    response.locals.typeItems = [
      {
        text: 'Any',
        value: 'none',
        checked: filters.type === 'none'
      },
      ...Object.values(SessionType).map((value) => ({
        text: value,
        value,
        checked: filters.type === value
      }))
    ]

    // Clean up session data
    delete data.q
    delete data.academicYear
    delete data.programme_ids
    delete data.status
    delete data.type

    response.render('session/list', { sessions })
  },

  filter(request, response) {
    const params = new URLSearchParams()

    // Radios and text inputs
    for (const key of ['academicYear', 'q', 'status', 'type']) {
      const value = request.body[key]
      if (value) {
        params.append(key, String(value))
      }
    }

    // Checkboxes
    for (const key of ['programme_ids']) {
      const value = request.body[key]
      const values = Array.isArray(value) ? value : [value]
      if (value) {
        values
          .filter((item) => item !== '_unchecked')
          .forEach((value) => {
            params.append(key, String(value))
          })
      }
    }

    response.redirect(`/sessions?${params}`)
  },

  readPatientSessions(request, response, next) {
    const { account } = request.app.locals
    const { view } = request.params
    let {
      options,
      q,
      consent,
      instruct,
      programme_ids,
      nextActivity,
      vaccineCriteria,
      yearGroup
    } = request.query
    const { data } = request.session
    const { session } = response.locals

    response.locals.view = view

    let results = session.patientSessions

    // Upgrade permissions according to session delegation settings
    if (session.nationalProtocol) {
      account.vaccineMethods.push(VaccineMethod.Injection)
    }

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

    // Filter by programme
    if (programme_ids) {
      programme_ids = Array.isArray(programme_ids)
        ? programme_ids
        : [programme_ids]
      results = results.filter((patientSession) =>
        programme_ids.includes(patientSession.programme_id)
      )
    }

    // Filter by next activity
    if (nextActivity && nextActivity !== 'none') {
      results = results.filter(
        (patientSession) => patientSession.nextActivity === nextActivity
      )
    }

    // Filter by vaccine criteria
    if (vaccineCriteria && vaccineCriteria !== 'none') {
      results = results.filter(
        (patientSession) => patientSession.vaccine?.criteria === vaccineCriteria
      )
    }

    // Filter by instruction outcome
    if (instruct && instruct !== 'none') {
      results = results.filter(
        (patientSession) => patientSession.instruct === instruct
      )
    }

    // Filter by exact consent status
    if (consent) {
      consent = Array.isArray(consent) ? consent : [consent]

      results = results.filter((patientSession) =>
        consent.some(
          (consentOutcome) => consentOutcome === patientSession.consent
        )
      )
    }

    // Filter by screen/instruct/register status
    const filters = {
      screen: request.query.screen || 'none',
      instruct: request.query.instruct || 'none',
      register: request.query.register || 'none',
      report: request.query.report || 'none'
    }

    for (const activity of ['screen', 'instruct', 'register', 'report']) {
      if (activity === view && filters[view] !== 'none') {
        results = results.filter(
          (patientSession) => patientSession[view] === filters[view]
        )
      }
    }

    // Don’t show screen outcome for children who have already been vaccinated
    if (view === 'screen') {
      results = results.filter(
        (patientSession) =>
          patientSession.outcome !== ProgrammeOutcome.Vaccinated
      )
    }

    // Filter by year group
    if (yearGroup) {
      results = results.filter(({ patient }) =>
        yearGroups.includes(patient.yearGroup)
      )
    }

    // Filter patient by display option
    for (const option of ['archived', 'hasMissingNhsNumber', 'post16']) {
      if (options?.includes(option)) {
        results = results.filter(({ patient }) => patient[option])
      }
    }

    // Filter patient session by display option
    for (const option of ['stillToVaccinate']) {
      if (options?.includes(option)) {
        results = results.filter((patientSession) => patientSession[option])
      }
    }

    // Remove patient sessions where outcome returns false
    results = results.filter((patientSession) => patientSession[view] !== false)

    // Only show patients ready to vaccinate, and that a user can vaccinate
    if (view === 'record') {
      results = results.filter(
        ({ nextActivity, register, vaccine }) =>
          nextActivity === Activity.Record &&
          register !== RegistrationOutcome.Pending &&
          account.vaccineMethods?.includes(vaccine?.method)
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

    // Programme filter options
    if (session.programmes.length > 1) {
      response.locals.programmeItems = session.programmes.map((programme) => ({
        text: programme.name,
        value: programme.id,
        checked: programme_ids?.includes(programme.id)
      }))
    }

    // Checkbox filter options (select many)
    const checkboxFilters = {
      consent: {
        consent: session.offersIntranasalVaccine
          ? Object.values(ConsentOutcome).filter(
              (outcome) => outcome !== ConsentOutcome.Given
            )
          : Object.values(ConsentOutcome).filter(
              (outcome) => outcome !== ConsentOutcome.GivenForIntranasal
            )
      }
    }

    response.locals.checkboxFilters = checkboxFilters[view]

    // Radio filter options (select one)
    const radioFilters = {
      screen: {
        screen: session.offersAlternativeVaccine
          ? Object.values(ScreenOutcome).filter(
              (value) => value !== ScreenOutcome.Vaccinate
            )
          : ScreenOutcome
      },
      instruct: {
        instruct: InstructionOutcome
      },
      register: {
        register: RegistrationOutcome,
        vaccineCriteria: session.offersAlternativeVaccine && VaccineCriteria,
        instruct: session.psdProtocol && InstructionOutcome,
        report: ProgrammeOutcome
      },
      record: {
        vaccineCriteria: session.offersAlternativeVaccine && VaccineCriteria
      },
      report: {
        report: ProgrammeOutcome
      }
    }

    response.locals.radioFilters = radioFilters[view]

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
    delete data.options
    delete data.q
    delete data.programme_ids
    delete data.vaccineCriteria
    delete data.consent
    delete data.screen
    delete data.instruct
    delete data.register
    delete data.report
    delete data.nextActivity

    next()
  },

  filterPatientSessions(request, response) {
    const { session_id, view } = request.params
    const params = new URLSearchParams()

    // Radios
    for (const key of [
      'q',
      'triage',
      'screen',
      'instruct',
      'register',
      'report',
      'vaccineCriteria',
      'nextActivity'
    ]) {
      const value = request.body[key]
      if (value) {
        params.append(key, String(value))
      }
    }

    // Checkboxes
    for (const key of ['options', 'consent', 'programme_ids', 'yearGroup']) {
      const value = request.body[key]
      const values = Array.isArray(value) ? value : [value]
      if (value) {
        values
          .filter((item) => item !== '_unchecked')
          .forEach((value) => {
            params.append(key, String(value))
          })
      }
    }

    response.redirect(`/sessions/${session_id}/${view}?${params}`)
  },

  edit(request, response) {
    const { session_id } = request.params
    const { data } = request.session

    // Setup wizard if not already setup
    let session = Session.findOne(session_id, data.wizard)
    if (!session) {
      session = Session.create(response.locals.session, data.wizard)
    }

    response.locals.session = new Session(session, data)

    // Show back link to session page
    response.locals.back = session.uri

    response.render('session/edit')
  },

  update(type) {
    return (request, response) => {
      const { session_id } = request.params
      const { data } = request.session
      const { __ } = response.locals

      // Update session data
      const session = Session.update(
        session_id,
        data.wizard.sessions[session_id],
        data
      )

      // Clean up session data
      delete data.session
      delete data.wizard

      request.flash('success', __(`session.${type}.success`, { session }))

      response.redirect(session.uri)
    }
  },

  readForm(type) {
    return (request, response, next) => {
      const { session_id } = request.params
      const { data, referrer } = request.session
      let { organisation } = response.locals

      organisation = Organisation.findOne(organisation?.code || 'RYG', data)

      // Setup wizard if not already setup
      let session = Session.findOne(session_id, data.wizard)
      if (!session) {
        session = Session.create(response.locals.session, data.wizard)
      }

      response.locals.session = new Session(session, data)

      const journey = {
        [`/`]: {},
        [`/${session_id}/${type}/type`]: {},
        [`/${session_id}/${type}/programmes`]: {
          [`/${session_id}/${type}/school`]: {
            data: 'session.type',
            value: SessionType.School
          },
          [`/${session_id}/${type}/clinic`]: {
            data: 'session.type',
            value: SessionType.Clinic
          }
        },
        ...(session.type === SessionType.School
          ? {
              [`/${session_id}/${type}/school`]: {},
              [`/${session_id}/${type}/dates`]: {}
            }
          : {
              [`/${session_id}/${type}/clinic`]: {},
              [`/${session_id}/${type}/dates`]: {}
            }),
        [`/${session_id}/${type}/dates-check`]: {},
        [`/${session_id}/${type}/check-answers`]: {},
        [`/${session_id}`]: {}
      }

      response.locals.paths = {
        ...wizard(journey, request),
        ...(type === 'edit' && {
          back: `${session.uri}/edit`,
          next: `${session.uri}/edit`
        }),
        ...(referrer && { back: referrer })
      }

      // Some questions are not asked during journey, so need explicit next path
      response.locals.paths.next =
        response.locals.paths.next || `${session.uri}/new/check-answers`

      response.locals.clinicIdItems = Object.values(organisation.clinics)
        .map((clinic) => new Clinic(clinic))
        .map((clinic) => ({
          text: clinic.name,
          value: clinic.id,
          ...(clinic.address && {
            attributes: {
              'data-hint': clinic.address.formatted.singleline
            }
          })
        }))

      next()
    }
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`session/form/${view}`)
  },

  updateForm(request, response) {
    const { session_id } = request.params
    const { data } = request.session
    const { paths } = response.locals

    Session.update(session_id, request.body.session, data.wizard)

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

  giveInstructions(request, response) {
    const { account } = request.app.locals
    const { __, session } = response.locals
    const { data } = request.session

    const patientsToInstruct = session.patientSessions
      .filter(({ nextActivity }) => nextActivity === Activity.Record)
      .filter(({ instruct }) => instruct === InstructionOutcome.Needed)

    for (const patientSession of patientsToInstruct) {
      const instruction = Instruction.create(
        {
          createdBy_uid: account.uid,
          programme_id: patientSession.programme.id,
          patientSession_uuid: patientSession.uuid
        },
        data
      )

      patientSession.giveInstruction(instruction)

      PatientSession.update(patientSession.uuid, patientSession, data)
    }

    request.flash('success', __(`session.instructions.success`))

    response.redirect(`${session.uri}/instruct`)
  },

  sendReminders(request, response) {
    const { __, session } = response.locals

    request.flash('success', __(`session.reminders.success`, { session }))

    response.redirect(session.uri)
  },

  close(request, response) {
    const { account } = request.app.locals
    const { session_id } = request.params
    const { data } = request.session
    const { __ } = response.locals

    // Update session as closed
    const session = Session.update(session_id, { closed: true }, data)

    // Find a clinic
    const clinic = Session.findAll(data)
      .filter(({ type }) => type === SessionType.Clinic)
      .find(({ programme_ids }) =>
        programme_ids.some((id) => session.programme_ids.includes(id))
      )

    // Move patients to clinic
    if (clinic) {
      const patientSessionsForClinic = session.patientSessionsForClinic.map(
        (patient) => patient.uuid
      )
      for (const patientSession of patientSessionsForClinic) {
        const patient = Patient.findOne(patientSession.patient_uuid, data)
        patientSession.removeFromSession({
          createdBy_uid: account.uid
        })
        patient.addToSession(patientSession)
        Patient.update(patientSession.patient_uuid, {}, data)
      }
    }

    request.flash('success', __(`session.close.success`, { session }))

    response.redirect(session.uri)
  }
}
