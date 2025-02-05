import wizard from '@x-govuk/govuk-prototype-wizard'

import { Batch } from '../models/batch.js'
import { PatientSession } from '../models/patient-session.js'
import { Programme } from '../models/programme.js'
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
    const { pid, uuid } = request.params
    const { data } = request.session

    const programme = Programme.read(pid, data)
    const vaccination = Vaccination.read(uuid, data)
    const { session } = vaccination

    response.locals.vaccination = vaccination
    response.locals.programme = programme
    response.locals.session = session

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
    const { uuid } = request.params
    const { data, referrer } = request.session
    const { vaccination } = response.locals

    // Setup wizard if not already setup
    if (!Vaccination.read(uuid, data.wizard)) {
      vaccination.create(vaccination, data.wizard)
    }

    // Show back link to referring page, else vaccination page
    response.locals.back = referrer || vaccination.uri
    response.locals.vaccination = new Vaccination(
      Vaccination.read(uuid, data.wizard),
      data
    )

    response.render('vaccination/edit')
  },

  new(request, response) {
    const { patientSession_uuid } = request.query
    const { data } = request.session

    const { patient, session } = PatientSession.read(patientSession_uuid, data)
    const { programme_pid } = data.patientSession.capture
    const { injectionSite, ready } =
      data.patientSession.preScreen[programme_pid]

    // Get programme
    const programme = Programme.read(programme_pid, data)

    // Check for default batch
    const defaultBatchId = session.defaultBatch_ids?.[programme.vaccine.gtin]

    const readyToVaccine = ready === 'true'
    const injectionSiteGiven = [
      VaccinationSite.ArmLeftUpper,
      VaccinationSite.ArmRightUpper
    ].includes(injectionSite)

    switch (true) {
      case readyToVaccine && injectionSiteGiven && defaultBatchId:
        data.startPath = 'check-answers'
        break
      case readyToVaccine && injectionSiteGiven:
        data.startPath = 'batch-id'
        break
      case readyToVaccine:
        data.startPath = 'administer'
        break
      default:
        data.startPath = 'decline'
    }

    // Temporarily store values to use during flow
    data.defaultBatchId = defaultBatchId
    data.patientSession_uuid = patientSession_uuid

    const vaccination = new Vaccination({
      location: session.formatted.location,
      patient_uuid: patient.uuid,
      programme_pid,
      school_urn: session.school_urn,
      session_id: session.id,
      vaccine_gtin: programme.vaccine.gtin,
      ...(data.token && { createdBy_uid: data.token?.uid }),
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

    vaccination.create(vaccination, data.wizard)
    patient.captureVaccination(vaccination)

    response.redirect(`${vaccination.uri}/new/${data.startPath}`)
  },

  update(request, response) {
    const { note } = request.body.vaccination
    const { form, uuid } = request.params
    const { data, referrer } = request.session
    const { __ } = response.locals

    const vaccination = new Vaccination(
      Vaccination.read(uuid, data.wizard),
      data
    )

    // Add note on check answers page
    if (note) {
      vaccination.note = note
    }

    request.flash('success', __(`vaccination.${form}.success`))

    // Clean up session data
    delete data.batch_id
    delete data.defaultBatchId
    delete data.patientSession_uuid
    delete data.startPath
    delete data.vaccination
    delete data.wizard

    // Update session data
    vaccination.update(vaccination, data)

    response.redirect(referrer || vaccination.uri)
  },

  readForm(request, response, next) {
    const { form, uuid } = request.params
    const { data, referrer } = request.session
    const { __, programme } = response.locals

    const vaccination = Vaccination.read(uuid, data.wizard)
    response.locals.vaccination = vaccination

    const patientSession = PatientSession.read(data.patientSession_uuid, data)
    response.locals.patientSession = patientSession

    const journey = {
      [`/`]: {},
      ...(data.startPath === 'decline'
        ? {
            [`/${uuid}/${form}/decline`]: {},
            [`/${uuid}/${form}/check-answers`]: {}
          }
        : {
            [`/${uuid}/${form}/administer`]: {
              [`/${uuid}/${form}/check-answers`]: () => {
                return data.defaultBatchId
              }
            },
            [`/${uuid}/${form}/batch-id`]: () => {
              return !data.defaultBatchId
            },
            ...(!patientSession.session?.address && {
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
    if (currentPath === data.startPath) {
      response.locals.paths = {
        back: referrer || vaccination.uri
      }
    }

    response.locals.batchItems = Batch.readAll(data)
      .filter((batch) => batch.vaccine.type === programme.type)
      .filter((batch) => !batch.archivedAt)

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

    response.locals.userItems = User.readAll(data)
      .map((user) => ({
        text: user.fullName,
        value: user.uid
      }))
      .sort((a, b) => {
        const textA = a.text.toUpperCase()
        const textB = b.text.toUpperCase()
        if (textA < textB) return -1
        if (textA > textB) return 1
        return 0
      })

    response.locals.vaccineItems = Vaccine.readAll(data)
      .filter((vaccine) => programme.type.includes(vaccine.type))
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
    const { data } = request.session
    const { paths, patientSession, programme, vaccination } = response.locals

    // Add dose amount and vaccination outcome based on dosage answer
    const { dosage } = request.body.vaccination
    if (dosage) {
      request.body.vaccination.dose =
        dosage === 'half' ? programme.vaccine.dose / 2 : programme.vaccine.dose
      request.body.vaccination.outcome =
        dosage === 'half'
          ? VaccinationOutcome.PartVaccinated
          : VaccinationOutcome.Vaccinated
    }

    // Get default batch, if saved
    if (data.defaultBatchId) {
      request.body.vaccination.batch_id = data.defaultBatchId
    }

    // Set default batch, if checked
    let { batch_id } = request.body
    if (batch_id) {
      // Checkbox submits ['_unchecked', BATCH_ID]
      batch_id = Array.isArray(batch_id) ? batch_id.at(-1) : batch_id
      const { gtin } = programme.vaccine

      patientSession.session.update(
        { defaultBatch_ids: { [gtin]: batch_id } },
        data
      )
    }

    vaccination.update(request.body.vaccination, data.wizard)

    const redirect = paths.next || `${vaccination.uri}/new/check-answers`

    response.redirect(redirect)
  }
}
