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
import { Instruction } from '../models/instruction.js'
import { Organisation } from '../models/organisation.js'
import { PatientSession } from '../models/patient-session.js'
import { Patient } from '../models/patient.js'
import { Session } from '../models/session.js'
import { DefaultBatchPresenter } from '../presenters/default-batch.js'
import { getDateValueDifference } from '../utils/date.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { formatYearGroup } from '../utils/string.js'

export const sessionController = {
  read(request, response, next, session_id) {
    const { data } = request.session

    const session = Session.findOne(session_id, data)
    response.locals.session = session

    response.locals.defaultBatches = DefaultBatchPresenter.forAll(data).filter(
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
        'outcome'
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
    const { account } = request.app.locals
    const { view } = request.params
    const {
      options,
      q,
      consent,
      instruct,
      programme_id,
      nextActivity,
      vaccineMethod,
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
    if (programme_id) {
      results = results.filter((patientSession) =>
        programme_id.includes(patientSession.programme_id)
      )
    }

    // Filter by next activity
    if (nextActivity && nextActivity !== 'none') {
      results = results.filter(
        (patientSession) => patientSession.nextActivity === nextActivity
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

    // Filter by display option
    for (const option of ['archived', 'hasMissingNhsNumber', 'post16']) {
      if (options?.includes(option)) {
        results = results.filter(({ patient }) => patient[option])
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
            (value) => value !== ScreenOutcome.Vaccinate
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

    // Next activity
    if (view === 'register' || view === 'outcome') {
      const nextActivityOutcomes = Object.values(Activity).filter(
        (value) =>
          ![Activity.Register, Activity.Report, Activity.DoNotRecord].includes(
            value
          )
      )

      response.locals.nextActivityItems = [
        {
          text: 'Any',
          value: 'none',
          checked: !nextActivity || nextActivity === 'none'
        },
        ...Object.values(nextActivityOutcomes).map((value) => ({
          text: value,
          value,
          checked: nextActivity === value
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
    delete data.options
    delete data.q
    delete data.programme_id
    delete data.vaccineMethod
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
      'outcome',
      'vaccineMethod',
      'nextActivity'
    ]) {
      const value = request.body[key]
      if (value) {
        params.append(key, String(value))
      }
    }

    // Checkboxes
    for (const key of ['options', 'consent', 'programme_id', 'yearGroup']) {
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
