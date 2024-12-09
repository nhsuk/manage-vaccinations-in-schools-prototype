import wizard from '@x-govuk/govuk-prototype-wizard'

import { Batch } from '../models/batch.js'
import { Patient } from '../models/patient.js'
import { Session } from '../models/session.js'
import { User } from '../models/user.js'
import {
  Vaccination,
  VaccinationMethod,
  VaccinationOutcome,
  VaccinationSite
} from '../models/vaccination.js'
import { Vaccine } from '../models/vaccine.js'
import { getToday } from '../utils/date.js'
import { getSessionPatientPath } from '../utils/session.js'

export const vaccinationController = {
  read(request, response, next) {
    const { programme, session } = request.app.locals
    const { uuid } = request.params
    const { data } = request.session

    const vaccination = new Vaccination(data.vaccinations[uuid], data)

    // Get default batch for vaccination, if set
    const defaultBatch = data.token?.batch?.[session?.id]
    if (defaultBatch) {
      const batchId = defaultBatch[programme.vaccine.gtin]
      // Default batch ID may be saved in FormData as an array
      request.app.locals.defaultBatchId = Array.isArray(batchId)
        ? batchId.at(-1)
        : batchId
    }

    request.app.locals.vaccination = vaccination

    next()
  },

  show(request, response) {
    response.render('vaccination/show')
  },

  redirect(request, response) {
    const { id, nhsn } = request.params

    response.redirect(`/sessions/${id}/${nhsn}`)
  },

  edit(request, response) {
    const { vaccination } = request.app.locals
    const { data, referrer } = request.session

    // Show back link to referring page, else vaccination page
    request.app.locals.back = referrer || vaccination.uri

    request.app.locals.vaccination = new Vaccination(
      {
        ...vaccination, // Previous values
        ...data?.wizard?.vaccination // Wizard values,
      },
      data
    )

    response.render('vaccination/edit')
  },

  new(request, response) {
    const { defaultBatchId, programme } = request.app.locals
    const { data } = request.session
    const { patient_uuid, session_id } = request.query

    const patient = new Patient(data.patients[patient_uuid])
    const session = new Session(data.sessions[session_id], data)
    const { injectionSite, ready } = data.preScreen

    const readyToVaccine = ready === 'true'
    const injectionSiteGiven =
      injectionSite === VaccinationSite.ArmLeftUpper ||
      injectionSite === VaccinationSite.ArmRightUpper
    const defaultBatchSet =
      defaultBatchId !== undefined && defaultBatchId !== '_unchecked'

    let startPath
    switch (true) {
      case readyToVaccine && injectionSiteGiven && defaultBatchSet:
        startPath = 'check-answers'
        break
      case readyToVaccine && injectionSiteGiven:
        startPath = 'batch-id'
        break
      case readyToVaccine:
        startPath = 'administer'
        break
      default:
        startPath = 'decline'
    }

    request.app.locals.back = getSessionPatientPath(session, patient)
    request.app.locals.startPath = startPath

    delete data.preScreen
    delete data.vaccination
    delete data?.wizard?.vaccination

    const vaccination = new Vaccination({
      location: session.formatted.location,
      urn: session.uri,
      patient_uuid,
      programme_pid: programme.pid,
      session_id: session.id,
      vaccine_gtin: programme.vaccine.gtin,
      ...(data.token && { created_user_uid: data.token?.uid }),
      ...(injectionSite && {
        dose: programme.vaccine.dose,
        injectionMethod: VaccinationMethod.Subcutaneous,
        injectionSite,
        outcome: VaccinationOutcome.Vaccinated
      }),
      ...(defaultBatchId && {
        batch_id: defaultBatchId
      })
    })

    data.wizard = { vaccination }

    response.redirect(`${vaccination.uri}/new/${startPath}`)
  },

  update(request, response) {
    const { programme, vaccination } = request.app.locals
    const { form } = request.params
    const { data, referrer } = request.session
    const { __ } = response.locals

    const patient = new Patient(data.patients[vaccination.patient_uuid])

    // Capture vaccination
    const updatedVaccination = new Vaccination({
      ...vaccination, // Previous values
      ...data?.wizard?.vaccination, // Wizard values (new flow)
      ...request.body.vaccination, // New values (edit flow)
      vaccine_gtin: programme.vaccine.gtin,
      created_user_uid: data.vaccination?.created_user_uid || data.token?.uid
    })

    // Check if new vaccination record or updating an existing one
    if (Object.keys(data.vaccinations).includes(updatedVaccination.uuid)) {
      updatedVaccination.updated = getToday()
    }

    // Add vaccination
    data.vaccinations[updatedVaccination.uuid] = updatedVaccination

    // Add vaccination outcome to patient
    patient.captureVaccination(updatedVaccination)

    // Add vaccination directly to CHIS record
    data.records[patient.nhsn].vaccination_uuids.push(updatedVaccination.uuid)

    // Clean up
    delete data?.wizard?.vaccination
    delete request.session.referrer
    delete request.app.locals.vaccination

    const action = form === 'edit' ? 'update' : 'create'
    request.flash('success', __(`vaccination.success.${action}`))

    response.redirect(referrer || updatedVaccination.uri)
  },

  readForm(request, response, next) {
    const { defaultBatchId, programme, session, startPath, vaccination } =
      request.app.locals
    const { form, uuid } = request.params
    const { data, referrer } = request.session
    const { __ } = response.locals

    request.app.locals.vaccination = new Vaccination(
      {
        ...(form === 'edit' && vaccination), // Previous values
        ...data?.wizard?.vaccination // Wizard values,
      },
      data
    )

    const journey = {
      [`/`]: {},
      ...(startPath === 'decline'
        ? {
            [`/${uuid}/${form}/decline`]: {},
            [`/${uuid}/${form}/check-answers`]: {}
          }
        : {
            [`/${uuid}/${form}/administer`]: {
              [`/${uuid}/${form}/check-answers`]: () => {
                return defaultBatchId
              }
            },
            [`/${uuid}/${form}/batch-id`]: () => {
              return !defaultBatchId
            },
            ...(!session?.address && {
              [`/${uuid}/${form}/location`]: {}
            }),
            [`/${uuid}/${form}/check-answers`]: {}
          }),
      [`/${uuid}`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' && {
        back: `${vaccination.uri}/edit`,
        next: `${vaccination.uri}/edit`
      })
    }

    // If first page in journey, return to page that initiated recording
    const currentPath = request.path.split('/').at(-1)
    if (currentPath === startPath) {
      response.locals.paths = {
        back: referrer || vaccination.uri
      }
    }

    response.locals.batchItems = Object.values(data.batches)
      .map((batch) => new Batch(batch, data))
      .filter((batch) => batch.vaccine.type === programme.type)
      .filter((batch) => !batch.archived)

    response.locals.injectionMethodItems = Object.entries(VaccinationMethod)
      .filter(([, value]) => value !== VaccinationMethod.Nasal)
      .map(([key, value]) => ({
        text: VaccinationMethod[key],
        value
      }))

    response.locals.injectionSiteItems = Object.entries(VaccinationSite)
      .filter(([, value]) => value !== VaccinationSite.Nose)
      .map(([key, value]) => ({
        text: VaccinationSite[key],
        value
      }))

    response.locals.locationItems = Object.entries(data.schools).map(
      ([, school]) => ({
        text: school.name,
        value: school.name
      })
    )

    response.locals.userItems = Object.entries(data.users)
      .map(([key, value]) => {
        const user = new User(value)

        return {
          text: user.fullName,
          value: key
        }
      })
      .sort((a, b) => {
        const textA = a.text.toUpperCase()
        const textB = b.text.toUpperCase()
        if (textA < textB) return -1
        if (textA > textB) return 1
        return 0
      })

    response.locals.vaccineItems = Object.values(data.vaccines)
      .filter((vaccine) => programme.type.includes(vaccine.type))
      .map((vaccine) => (vaccine = new Vaccine(vaccine, data)))
      .map((vaccine) => ({
        text: vaccine.brandWithType,
        value: vaccine.gtin
      }))

    response.locals.declineItems = Object.entries(VaccinationOutcome)
      .filter(
        ([, value]) =>
          value === VaccinationOutcome.AlreadyVaccinated ||
          value === VaccinationOutcome.Contraindications ||
          value === VaccinationOutcome.Refused ||
          value === VaccinationOutcome.Unwell
      )
      .map(([key, value]) => ({
        text: __(`vaccination.outcome.${key}`),
        value
      }))

    next()
  },

  showForm(request, response) {
    const { form, view } = request.params

    response.render(`vaccination/form/${view}`, { form })
  },

  updateForm(request, response) {
    const { defaultBatchId, programme, vaccination } = request.app.locals
    const { data } = request.session
    const { paths } = response.locals

    // Add dose amount and vaccination outcome based on dosage answer
    if (request.body.vaccination.dosage) {
      vaccination.dose =
        request.body.vaccination.dosage === 'half'
          ? programme.vaccine.dose / 2
          : programme.vaccine.dose
      vaccination.outcome =
        request.body.vaccination.dosage === 'half'
          ? VaccinationOutcome.PartVaccinated
          : VaccinationOutcome.Vaccinated
    }

    // Use default batch, if set
    if (defaultBatchId) {
      vaccination.batch_id = defaultBatchId
    }

    data.wizard.vaccination = new Vaccination(
      Object.assign(
        vaccination, // Previous values
        data.wizard.vaccination, // Wizard values
        request.body.vaccination // New value
      )
    )

    const redirect = paths.next || `${vaccination.uri}/new/check-answers`

    response.redirect(redirect)
  }
}
