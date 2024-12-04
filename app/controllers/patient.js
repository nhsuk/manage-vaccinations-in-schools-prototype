import _ from 'lodash'

import { Cohort } from '../models/cohort.js'
import {
  CaptureOutcome,
  ConsentOutcome,
  Patient,
  PatientOutcome,
  TriageOutcome
} from '../models/patient.js'
import {
  Programme,
  ProgrammeType,
  programmeTypes
} from '../models/programme.js'
import { Record } from '../models/record.js'
import { Reply } from '../models/reply.js'
import { School } from '../models/school.js'
import { Session } from '../models/session.js'
import { Vaccination, VaccinationSite } from '../models/vaccination.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const patientController = {
  readAll(request, response, next) {
    let { page, limit, q, hasMissingNhsNumber } = request.query
    const { data } = request.session

    let patients = Object.values(data.patients).map(
      (patient) => new Patient(patient)
    )

    // Sort
    patients = _.sortBy(patients, 'lastName')

    // Paginate
    page = parseInt(page) || 1
    limit = parseInt(limit) || 200

    // Filter
    if (hasMissingNhsNumber) {
      patients = patients.filter(
        (patient) => patient.record.hasMissingNhsNumber
      )
    }

    if (q) {
      patients = patients.filter((patient) => {
        const fullName = String(patient.fullName).toLowerCase()
        const query = q.toLowerCase()

        return fullName.includes(query)
      })
    }

    delete data.hasMissingNhsNumber
    delete data.q

    response.locals.patients = patients
    response.locals.results = getResults(patients, page, limit)
    response.locals.pages = getPagination(patients, page, limit)

    next()
  },

  updateAll(request, response) {
    const { hasMissingNhsNumber, q } = request.body

    const params = {}

    if (q) {
      params.q = String(q)
    }

    if (hasMissingNhsNumber && hasMissingNhsNumber[0] === 'true') {
      params.hasMissingNhsNumber = true
    }

    // @ts-ignore
    const queryString = new URLSearchParams(params).toString()

    response.redirect(`/patients?${queryString}`)
  },

  showAll(request, response) {
    response.render('patient/list')
  },

  read(request, response, next) {
    const { id, nhsn } = request.params
    const { data } = request.session
    const { patients } = response.locals

    let patient = patients.find((patient) => patient.record.nhsn === nhsn)

    // If no patient found, use CHIS record (patient not imported yet)
    if (!patient) {
      const record = Object.values(data.records).find(
        (record) => record.nhsn === nhsn
      )
      patient = { record }
    }

    patient = new Patient(patient)

    const cohorts = Object.values(patient.cohorts).map(
      (uid) => new Cohort(data.cohorts[uid])
    )

    let sessions = []
    if (patient.session_id) {
      sessions = [new Session(data.sessions[patient.session_id], data)]
    }

    let vaccinations = Object.keys(patient.vaccinations).map(
      (uuid) => new Vaccination(data.vaccinations[uuid])
    )

    const inSession = request.originalUrl.includes('sessions')
    const replies = Object.values(patient.replies).map(
      (reply) => new Reply(reply)
    )

    // Patient in session
    if (inSession) {
      const session = new Session(data.sessions[id], data)

      // Select first programme in session to show pre-screening questions
      // TODO: Make pre-screening questions pull from all session programmes
      const programme_pid = session.programmes[0]
      const programme = new Programme(data.programmes[programme_pid])
      const fluPid = programmeTypes[ProgrammeType.Flu].pid

      response.locals.options = {
        editGillick:
          patient.consent?.value !== ConsentOutcome.Given &&
          patient.outcome?.value !== PatientOutcome.Vaccinated,
        showGillick:
          !session.programmes?.includes(fluPid) &&
          session.isActive &&
          patient.consent?.value !== ConsentOutcome.Given,
        showReminder: patient.consent?.value === ConsentOutcome.NoResponse,
        getReply: Object.values(patient.replies).length === 0,
        editReplies:
          patient.consent?.value !== ConsentOutcome.Given &&
          patient.outcome?.value !== PatientOutcome.Vaccinated,
        editTriage:
          patient.triage?.value === TriageOutcome.Completed &&
          patient.outcome?.value !== PatientOutcome.Vaccinated,
        showTriage:
          patient.consentHealthAnswers &&
          patient.triage?.value === TriageOutcome.Needed &&
          patient.outcome?.value === PatientOutcome.NoOutcomeYet,
        editRegistration:
          patient.consent?.value === ConsentOutcome.Given &&
          patient.triage?.value !== TriageOutcome.Needed &&
          patient.outcome?.value !== PatientOutcome.Vaccinated,
        showPreScreen:
          patient.capture?.value === CaptureOutcome.Vaccinate &&
          patient.outcome?.value !== PatientOutcome.Vaccinated &&
          patient.outcome?.value !== PatientOutcome.CouldNotVaccinate
      }

      vaccinations = vaccinations.filter(
        (vaccination) => vaccination.session_id === id
      )

      response.locals.injectionSiteItems = Object.entries(VaccinationSite)
        .filter(([, value]) =>
          [
            VaccinationSite.ArmLeftUpper,
            VaccinationSite.ArmRightUpper,
            VaccinationSite.Other
          ].includes(value)
        )
        .map(([key, value]) => ({
          text: VaccinationSite[key],
          value
        }))

      response.locals.programme = programme
      response.locals.session = session
    }

    response.locals.inSession = inSession
    response.locals.patient = patient
    response.locals.replies = replies
    response.locals.cohorts = cohorts
    response.locals.sessions = sessions
    response.locals.vaccinations = vaccinations

    request.app.locals.record = patient.record

    next()
  },

  show(request, response) {
    let { view } = request.params
    const { inSession } = response.locals

    if (!view) {
      view = inSession ? 'session' : 'show'
    }

    response.render(`patient/${view}`)
  },

  edit(request, response) {
    const { back, record } = request.app.locals
    const { referrer } = request.query
    const { data } = request.session
    const { patient } = response.locals

    request.app.locals.back = referrer || back || patient.uri
    request.app.locals.record = new Record({
      ...record, // Previous values
      ...data?.wizard?.record // Wizard values
    })

    response.render('patient/edit')
  },

  update(request, response) {
    const { back, record } = request.app.locals
    const { data } = request.session
    const { __, patient } = response.locals

    const updatedRecord = new Record(
      Object.assign(
        record, // Previous values
        data?.wizard?.record, // Wizard values
        request.body.record // New values
      )
    )

    const updatedPatient = new Patient(
      Object.assign(patient, { record: updatedRecord })
    )

    data.patients[updatedPatient.uuid] = updatedPatient

    // Clean up
    delete data?.wizard?.record
    delete request.app.locals.back
    delete request.app.locals.record

    request.flash('success', __('patient.success.update'))

    const redirect = back || updatedPatient.uri
    response.redirect(redirect)
  },

  readForm(request, response, next) {
    const { back, record } = request.app.locals
    const { form } = request.params
    const { referrer } = request.query
    const { data } = request.session
    const { patient } = response.locals

    request.app.locals.referrer = referrer || back
    request.app.locals.record = new Record({
      ...record,
      ...(form === 'edit' && record), // Previous values
      ...data?.wizard?.record // Wizard values
    })

    response.locals.paths = {
      ...(form === 'edit' && {
        back: `${patient.uri}/edit`,
        next: `${patient.uri}/edit`
      })
    }

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

    // Edit each parent using the same view
    if (view.includes('parent')) {
      response.locals.parentId = view.split('-')[1]
      view = 'parent'
    }

    response.render(`patient/form/${view}`, { form })
  },

  updateForm(request, response) {
    const { record } = request.app.locals
    const { data } = request.session
    const { paths } = response.locals

    data.wizard.record = new Record(
      Object.assign(
        record, // Previous values
        request.body.record // New value
      )
    )

    response.redirect(paths.next)
  }
}
