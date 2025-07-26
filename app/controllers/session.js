import wizard from '@x-govuk/govuk-prototype-wizard'
import _ from 'lodash'

import {
  AcademicYear,
  Activity,
  ConsentOutcome,
  InstructionOutcome,
  PatientOutcome,
  RegistrationOutcome,
  ScreenOutcome,
  SessionType,
  VaccinationOutcome,
  VaccineMethod
} from '../enums.js'
import { Clinic } from '../models/clinic.js'
import { DefaultBatch } from '../models/default-batch.js'
import { Instruction } from '../models/instruction.js'
import { Organisation } from '../models/organisation.js'
import { Patient } from '../models/patient.js'
import { Session } from '../models/session.js'
import { getDateValueDifference } from '../utils/date.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { getSessionActivityCount } from '../utils/session.js'
import { formatYearGroup } from '../utils/string.js'

export const sessionController = {
  read(request, response, next, session_id) {
    const { data } = request.session

    response.locals.session = Session.read(session_id, data)

    response.locals.defaultBatches = DefaultBatch.readAll(data).filter(
      (defaultBatch) => defaultBatch.session_id === session_id
    )

    next()
  },

  readAll(request, response, next) {
    response.locals.sessions = Session.readAll(request.session.data)

    next()
  },

  show(request, response) {
    let { view } = request.params
    const { session } = response.locals

    if (
      [
        'consent',
        'screen',
        'instruct',
        'register',
        'record',
        'outcome'
      ].includes(view)
    ) {
      view = 'activity'
    } else if (!view) {
      view = 'show'
    }

    const activity = {
      checkGiven: getSessionActivityCount(session, [
        {
          consent: ConsentOutcome.Given
        }
      ]),
      checkGivenForNasalSpray: getSessionActivityCount(session, [
        {
          consent: ConsentOutcome.GivenForNasalSpray
        }
      ]),
      checkGivenForInjection: getSessionActivityCount(session, [
        {
          consent: ConsentOutcome.GivenForInjection
        }
      ]),
      checkRefusal: getSessionActivityCount(session, [
        {
          consent: ConsentOutcome.Refused
        }
      ])
    }

    response.render(`session/${view}`, {
      activity
    })
  },

  new(request, response) {
    const { data } = request.session

    const session = new Session(
      {
        // TODO: This needs contextual organisation data to work
        registration: data.organisation.sessionRegistration,
        ...(data.token && { createdBy_uid: data.token?.uid })
      },
      data
    )

    session.create(session, data.wizard)

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

    const primaryProgrammesMap = new Map()
    sessions
      .filter((session) => session.academicYear === filters.academicYear)
      .flatMap((session) => session.primaryProgrammes || [])
      .forEach((programme) => {
        primaryProgrammesMap.set(programme.id, programme)
      })

    const primaryProgrammes = [...primaryProgrammesMap.values()]

    // Programme filter options
    if (primaryProgrammes.length > 1) {
      response.locals.programmeItems = primaryProgrammes
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

    // Radios
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
    const { permissions } = request.app.locals
    const { view } = request.params
    const {
      consent,
      hasMissingNhsNumber,
      programme_id,
      q,
      vaccineMethod,
      instruct,
      yearGroup
    } = request.query
    const { data } = request.session
    const { session } = response.locals

    response.locals.view = view

    let results = session.patientSessions

    // Upgrade permissions according to session delegation settings
    if (session.nationalProtocol) {
      permissions.vaccineMethods.push(VaccineMethod.Injection)
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
    if (programme_id) {
      results = results.filter((patientSession) =>
        programme_id.includes(patientSession.programme_id)
      )
    }

    // Filter by vaccine method
    if (vaccineMethod && vaccineMethod !== 'none') {
      results = results.filter(
        (patientSession) => patientSession.vaccine?.method === vaccineMethod
      )
    }

    // Filter by instruction outcome
    if (instruct && instruct !== 'none') {
      results = results.filter(
        (patientSession) => patientSession.instruct === instruct
      )
    }

    // Filter by consent status
    if (consent) {
      results = results.filter((patientSession) =>
        consent.includes(patientSession.consent)
      )
    }

    // Filter by screen/instruct/register/outcome status
    const filters = {
      screen: request.query.screen || 'none',
      instruct: request.query.instruct || 'none',
      register: request.query.register || 'none',
      record: 'none',
      outcome: request.query.outcome || 'none'
    }

    for (const activity of ['screen', 'instruct', 'register', 'outcome']) {
      if (activity === view && filters[view] !== 'none') {
        results = results.filter(
          (patientSession) => patientSession[view] === filters[view]
        )
      }
    }

    // Don’t show screen outcome for children who have already been vaccinated
    if (view === 'screen') {
      results = results.filter(
        (patientSession) => patientSession.outcome !== PatientOutcome.Vaccinated
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

    // Only show patients ready to vaccinate, and that a user can vaccinate
    if (view === 'record') {
      results = results.filter(
        ({ nextActivity, register, vaccine }) =>
          nextActivity === Activity.Record &&
          register !== RegistrationOutcome.Pending &&
          permissions?.vaccineMethods?.includes(vaccine?.method)
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
        checked: programme_id?.includes(programme.id)
      }))
    }

    // Vaccination method and instruction outcome filter options
    // (if session administering alternative)
    if (
      session.offersAlternativeVaccine &&
      ['register', 'record', 'outcome'].includes(view)
    ) {
      response.locals.vaccineMethodItems = [
        {
          text: 'Any',
          value: 'none',
          checked: !vaccineMethod || vaccineMethod === 'none'
        },
        ...Object.values(VaccineMethod).map((value) => ({
          text: value,
          value,
          checked: vaccineMethod === value
        }))
      ]

      response.locals.instructItems = [
        {
          text: 'Any',
          value: 'none',
          checked: !instruct || instruct === 'none'
        },
        ...Object.values(InstructionOutcome).map((value) => ({
          text: value,
          value,
          checked: instruct === value
        }))
      ]
    }

    // Consent status filter options (select many)
    if (view === 'consent') {
      const consentOutcomes = session.offersAlternativeVaccine
        ? Object.values(ConsentOutcome).filter(
            (outcome) => outcome !== ConsentOutcome.Given
          )
        : ConsentOutcome

      response.locals.statusesItems = Object.values(consentOutcomes).map(
        (value) => ({
          text: value,
          value,
          checked: request.query.consent === value
        })
      )
    }

    // Screen/register/outcome status filter options (select one)
    for (const activity of ['screen', 'instruct', 'register', 'outcome']) {
      const screenOutcomes = session.offersAlternativeVaccine
        ? Object.values(ScreenOutcome).filter(
            (outcome) => outcome !== ScreenOutcome.Vaccinate
          )
        : ScreenOutcome

      const statusItems = {
        screen: screenOutcomes,
        instruct: InstructionOutcome,
        register: RegistrationOutcome,
        outcome: VaccinationOutcome
      }

      if (view === activity && statusItems[view]) {
        response.locals.statusItems = [
          {
            text: 'Any',
            value: 'none',
            checked: filters[view] === 'none'
          },
          ...Object.values(statusItems[view]).map((value) => ({
            text: value,
            value,
            checked: filters[view] === value
          }))
        ]
      }
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
    delete data.programme_id
    delete data.vaccineMethod
    delete data.q
    delete data.consent
    delete data.screen
    delete data.instruct
    delete data.register
    delete data.report

    next()
  },

  filterPatientSessions(request, response) {
    const { session_id, view } = request.params
    const { hasMissingNhsNumber } = request.body
    const params = new URLSearchParams()

    // Radios
    for (const key of [
      'q',
      'triage',
      'screen',
      'instruct',
      'register',
      'outcome',
      'vaccineMethod'
    ]) {
      const value = request.body[key]
      if (value) {
        params.append(key, String(value))
      }
    }

    // Checkboxes
    for (const key of ['consent', 'programme_id', 'yearGroup']) {
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

    if (hasMissingNhsNumber?.includes('true')) {
      params.append('hasMissingNhsNumber', 'true')
    }

    response.redirect(`/sessions/${session_id}/${view}?${params}`)
  },

  edit(request, response) {
    const { session_id } = request.params
    const { data } = request.session
    const { session } = response.locals

    // Setup wizard if not already setup
    if (!Session.read(session_id, data.wizard)) {
      session.create(session, data.wizard)
    }

    // Show back link to session page
    response.locals.back = session.uri
    response.locals.session = new Session(
      Session.read(session_id, data.wizard),
      data
    )

    response.render('session/edit')
  },

  update(type) {
    return (request, response) => {
      const { session_id } = request.params
      const { data } = request.session
      const { __ } = response.locals

      const session = new Session(Session.read(session_id, data.wizard), data)

      request.flash('success', __(`session.${type}.success`, { session }))

      // Clean up session data
      delete data.session
      delete data.wizard

      // Update session data
      session.update(session, data)

      response.redirect(session.uri)
    }
  },

  readForm(type) {
    return (request, response, next) => {
      const { session_id } = request.params
      const { data, referrer } = request.session
      let { organisation } = response.locals

      organisation = Organisation.read(organisation?.code || 'RYG', data)

      const session = new Session(Session.read(session_id, data.wizard), data)
      response.locals.session = session

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

  giveInstructions(request, response) {
    const { __, session } = response.locals
    const { data } = request.session

    for (const patientSession of session.patientsToInstruct) {
      const instruction = new Instruction({
        createdBy_uid: data.token?.uid,
        programme_id: patientSession.programme.id,
        patientSession_uuid: patientSession.uuid
      })

      instruction.create(instruction, data)

      patientSession.giveInstruction(instruction)

      patientSession.update(patientSession, data)
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
    const { data } = request.session
    const { __, session } = response.locals

    request.flash('success', __(`session.close.success`, { session }))

    // Update session as closed
    session.update({ closed: true }, data)

    // Find a clinic
    const clinic = Session.readAll(data)
      .filter(({ type }) => type === SessionType.Clinic)
      .find(({ programme_ids }) =>
        programme_ids.some((id) => session.programme_ids.includes(id))
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
        patient.addToSession(patientSession)
        patient.update({}, data)
      }
    }

    response.redirect(session.uri)
  }
}
