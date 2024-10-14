import { wizard } from 'nhsuk-prototype-rig'
import { getToday } from '../utils/date.js'
import { Batch } from '../models/batch.js'
import { Patient } from '../models/patient.js'
import { Record } from '../models/record.js'
import { Session } from '../models/session.js'
import { User } from '../models/user.js'
import {
  Vaccination,
  VaccinationMethod,
  VaccinationOutcome,
  VaccinationSite
} from '../models/vaccination.js'
import { Vaccine } from '../models/vaccine.js'

export const vaccinationController = {
  read(request, response, next) {
    const { patient } = request.app.locals
    const { uuid } = request.params
    const { data } = request.session

    const vaccination = new Vaccination(data.vaccinations[uuid])
    const patient_uuid = vaccination?.patient_uuid || patient?.uuid
    const record = new Record(data.patients[patient_uuid].record)

    request.app.locals.vaccination = vaccination
    request.app.locals.record = record

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
    const { back, vaccination } = request.app.locals
    const { referrer } = request.query
    const { data } = request.session

    request.app.locals.back = referrer || back || vaccination.uri
    request.app.locals.vaccination = new Vaccination({
      ...vaccination, // Previous values
      ...data?.wizard?.vaccination // Wizard values,
    })

    response.render('vaccination/edit')
  },

  new(request, response) {
    const { programme } = request.app.locals
    const { data } = request.session
    const { patient_uuid, session_id } = request.query

    const patient = new Patient(data.patients[patient_uuid])
    const startPath =
      data.preScreen.continue === 'true' ? 'administer' : 'decline'

    request.app.locals.patient = patient
    request.app.locals.back = patient.uri
    request.app.locals.startPath = startPath

    delete data.preScreen
    delete data.vaccination
    delete data?.wizard?.vaccination

    const session = new Session(data.sessions[session_id])

    const vaccination = new Vaccination({
      location: session.location.name,
      urn: session.urn,
      patient_uuid,
      programme_pid: programme.pid,
      session_id: session.id,
      vaccine_gtin: programme.vaccine.gtin,
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    data.wizard = { vaccination }

    response.redirect(`${vaccination.uri}/new/${startPath}`)
  },

  update(request, response) {
    const { back, programme, vaccination } = request.app.locals
    const { form } = request.params
    const { data } = request.session
    const { __ } = response.locals

    const patient = new Patient(data.patients[vaccination.patient_uuid])

    // Capture vaccination
    const updatedVaccination = new Vaccination({
      ...vaccination, // Previous values
      ...data?.wizard?.vaccination, // Wizard values (new flow)
      ...request.body.vaccination, // New values (edit flow)
      vaccine_gtin: programme.vaccine.gtin,
      batch_expires:
        vaccination.batch_expires ||
        data.batches[vaccination.batch_id]?.expires,
      created_user_uid: data.vaccination?.created_user_uid || data.token?.uid
    })

    // Check if new vaccination record or updating an existing one
    if (Object.keys(data.vaccinations).includes(updatedVaccination.uuid)) {
      updatedVaccination.updated = getToday().toISOString()
    }

    // Add vaccination
    data.vaccinations[updatedVaccination.uuid] = updatedVaccination

    // Add vaccination outcome to patient
    patient.capture = updatedVaccination

    // Add vaccination directly to CHIS record
    data.records[patient.nhsn].vaccinations.push(updatedVaccination.uuid)

    // Clean up
    delete data?.wizard?.vaccination
    delete request.app.locals.back
    delete request.app.locals.vaccination

    const action = form === 'edit' ? 'update' : 'create'
    request.flash('success', __(`vaccination.success.${action}`))

    const redirect = back || updatedVaccination.uri
    response.redirect(redirect)
  },

  readForm(request, response, next) {
    const { back, programme, session, startPath, vaccination } =
      request.app.locals
    const { form, uuid } = request.params
    const { referrer } = request.query
    const { data } = request.session
    const { __ } = response.locals

    request.app.locals.referrer = referrer || back
    request.app.locals.vaccination = new Vaccination({
      ...(form === 'edit' && vaccination), // Previous values
      ...data?.wizard?.vaccination // Wizard values,
    })

    // Check if default batch saved for session in programme
    let defaultBatchForProgramme = false
    const defaultBatch = data.token?.batch?.[session.id]
    if (defaultBatch) {
      defaultBatchForProgramme = programme.vaccines.filter((vaccine) =>
        Object.keys(defaultBatch).includes(vaccine)
      )
    }

    const journey = {
      [`/`]: {},
      ...(startPath === 'administer'
        ? {
            [`/${uuid}/${form}/administer`]: {
              [`/${uuid}/${form}/check-answers`]: () => {
                return defaultBatchForProgramme
              }
            },
            [`/${uuid}/${form}/batch-id`]: () => {
              return !defaultBatchForProgramme
            },
            [`/${uuid}/${form}/check-answers`]: {}
          }
        : {
            [`/${uuid}/${form}/decline`]: {},
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

    response.locals.batchItems = Object.values(data.batches)
      .map((batch) => new Batch(batch))
      .filter((batch) => batch.vaccine.type === programme.type)

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
      .map((vaccine) => (vaccine = new Vaccine(vaccine)))
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
    const { programme, session, vaccination } = request.app.locals
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
    const defaultBatch = data.token?.batch?.[session?.id]
    if (defaultBatch) {
      let batchId = defaultBatch[programme.vaccine.gtin]
      // Default batch ID may be saved in FormData as an array
      batchId = Array.isArray(batchId) ? batchId.at(-1) : batchId
      vaccination.batch_id = batchId
    }

    data.wizard.vaccination = new Vaccination(
      Object.assign(
        vaccination, // Previous values
        request.body.vaccination // New value
      )
    )

    const redirect = paths.next || `${vaccination.uri}/new/check-answers`

    response.redirect(redirect)
  }
}
