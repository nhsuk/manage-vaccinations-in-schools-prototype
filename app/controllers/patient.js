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
import { Reply } from '../models/reply.js'
import { School } from '../models/school.js'
import { Session } from '../models/session.js'
import { Vaccination, VaccinationSite } from '../models/vaccination.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { getSessionPatientPath } from '../utils/session.js'

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
      patients = patients.filter((patient) => patient.hasMissingNhsNumber)
    }

    // Query
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

    let patient = patients.find((patient) => patient.nhsn === nhsn)

    // If no patient found, use CHIS record (patient not imported yet)
    if (!patient) {
      const record = Object.values(data.records).find(
        ({ record }) => record.nhsn === nhsn
      )
      patient = { record }
    }

    patient = new Patient(patient)

    const cohorts = Object.values(patient.cohort_uids).map(
      (uid) => new Cohort(data.cohorts[uid], data)
    )

    const sessions = Object.values(patient.session_ids).map(
      (id) => new Session(data.sessions[id], data)
    )

    let vaccinations = Object.keys(patient.vaccinations).map(
      (uuid) => new Vaccination(data.vaccinations[uuid])
    )

    const inSession = request.originalUrl.includes('sessions')
    const replies = Object.values(patient.replies).map(
      (reply) => new Reply(reply, data)
    )

    // Patient in session
    if (inSession) {
      const session = new Session(data.sessions[id], data)

      // Select first programme in session to show pre-screening questions
      // TODO: Make pre-screening questions pull from all session programmes
      const programme_pid = session.programme_pids[0]
      const programme = new Programme(data.programmes[programme_pid])
      const fluPid = programmeTypes[ProgrammeType.Flu].pid

      response.locals.sessionPatientPath = getSessionPatientPath(
        session,
        patient
      )

      response.locals.options = {
        editGillick:
          patient.consent?.value !== ConsentOutcome.Given &&
          patient.outcome?.value !== PatientOutcome.Vaccinated,
        showGillick:
          !session.programme_pids?.includes(fluPid) &&
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
    const { data, referrer } = request.session
    const { patient } = response.locals

    // Show back link to referring page, else patient page
    response.locals.back = referrer || patient.uri

    response.locals.patient = new Patient({
      ...patient, // Previous values
      ...data?.wizard?.patient // Wizard values
    })

    response.render('patient/edit')
  },

  update(request, response) {
    const { data, referrer } = request.session
    const { __, patient } = response.locals

    const updatedPatient = new Patient(
      Object.assign(
        patient, // Previous values
        data?.wizard?.patient, // Wizard values
        request.body.patient // New values
      )
    )

    data.patients[updatedPatient.uuid] = updatedPatient

    // Clean up
    delete request.session.referrer
    delete data?.wizard?.patient

    request.flash('success', __('patient.success.update'))

    response.redirect(referrer || updatedPatient.uri)
  },

  readForm(request, response, next) {
    const { form } = request.params
    const { data } = request.session
    const { patient } = response.locals

    response.locals.patient = new Patient({
      ...patient,
      ...(form === 'edit' && patient), // Previous values
      ...data?.wizard?.patient // Wizard values
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
    const { data } = request.session
    const { paths, patient } = response.locals

    data.wizard.patient = new Patient(
      Object.assign(
        patient, // Previous values
        request.body.patient // New value
      )
    )

    response.redirect(paths.next)
  }
}
