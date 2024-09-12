import { wizard } from 'nhsuk-prototype-rig'
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

  readReview(request, response, next) {
    const { back, record, vaccination } = request.app.locals
    const { referrer } = request.query

    request.app.locals.back = referrer || back || vaccination.uri

    // Fake issue with date of birth field
    const duplicateRecord = new Record(record)
    const dob = new Date(duplicateRecord.dob)
    dob.setFullYear(dob.getFullYear() - 2)
    duplicateRecord.dob = dob

    // Fake issue with date of vaccination field
    const duplicateVaccination = new Vaccination(vaccination)
    const created = new Date(duplicateVaccination.created)
    created.setMonth(dob.getMonth() - 1)
    duplicateVaccination.created = created

    response.locals.duplicateRecord = duplicateRecord
    response.locals.duplicateVaccination = duplicateVaccination

    next()
  },

  showReview(request, response) {
    response.render('vaccination/review')
  },

  updateReview(request, response) {
    const { back } = request.app.locals
    const { decision } = request.body
    const { __ } = response.locals

    // Doesn’t change any values, but shows a confirmation message
    if (decision === 'duplicate') {
      request.flash('success', __('vaccination.success.update'))
    }

    response.redirect(back)
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

    request.app.locals.patient = patient
    request.app.locals.back = patient.uri

    request.app.locals.start =
      data.preScreen.continue === 'true' ? 'administer' : 'decline'

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
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    data.wizard = { vaccination }

    response.redirect(`${vaccination.uri}/new/${request.app.locals.start}`)
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
      updatedVaccination.updated = new Date().toISOString()
    }

    // Add vaccination
    data.vaccinations[updatedVaccination.uuid] = updatedVaccination

    // Add vaccination outcome to patient
    patient.capture = updatedVaccination

    // Add vaccination directly to CHIS record
    if (!data.features.uploads.on && !updatedVaccination.updated) {
      data.records[patient.nhsn].vaccinations.push(updatedVaccination.uuid)
    }

    delete data?.wizard?.vaccination
    delete request.app.locals.back
    delete request.app.locals.vaccination

    const action = form === 'edit' ? 'update' : 'create'
    request.flash('success', __(`vaccination.success.${action}`))

    const redirect = back || updatedVaccination.uri
    response.redirect(redirect)
  },

  readForm(request, response, next) {
    const { back, start, programme, vaccination } = request.app.locals
    const { form, id, uuid } = request.params
    const { referrer } = request.query
    const { data } = request.session
    const { __ } = response.locals

    request.app.locals.referrer = referrer || back

    request.app.locals.vaccination = new Vaccination({
      ...(form === 'edit' && vaccination), // Previous values
      ...data?.wizard?.vaccination // Wizard values,
    })

    const journey = {
      [`/`]: {},
      ...(start === 'administer'
        ? {
            [`/${uuid}/${form}/administer`]: {
              [`/${uuid}/${form}/check-answers`]: () => {
                return data.token?.batch?.[id]
              }
            },
            [`/${uuid}/${form}/batch-id`]: () => {
              return !data.token?.batch?.[id]
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
      ([urn, school]) => ({
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
        text: vaccine.brandWithName,
        value: vaccine.gtin
      }))

    response.locals.declineItems = Object.entries(VaccinationOutcome)
      .filter(
        ([, value]) =>
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
    const { programme, vaccination } = request.app.locals
    const { id } = request.params
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
    if (data.token?.batch?.[id]) {
      vaccination.batch_id = data.token.batch[id][0]
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
