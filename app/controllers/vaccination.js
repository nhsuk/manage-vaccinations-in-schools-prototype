import wizard from '@x-govuk/govuk-prototype-wizard'

import { Batch } from '../models/batch.js'
import { Patient } from '../models/patient.js'
import { Programme } from '../models/programme.js'
import { Session } from '../models/session.js'
import { User } from '../models/user.js'
import {
  Vaccination,
  VaccinationMethod,
  VaccinationOutcome,
  VaccinationSite
} from '../models/vaccination.js'
import { Vaccine } from '../models/vaccine.js'
import { getSessionPatientPath } from '../utils/session.js'

export const vaccinationController = {
  read(request, response, next) {
    const { pid, uuid } = request.params
    const { data } = request.session

    const programme = Programme.read(pid, data)
    const vaccination = Vaccination.read(uuid, data)
    const { session } = vaccination

    // Get default batch for vaccination, if set
    const defaultBatch = data.token?.batch?.[session?.id]
    if (defaultBatch) {
      const batchId = defaultBatch[programme.vaccine.gtin]
      // Default batch ID may be saved in FormData as an array
      response.locals.defaultBatchId = Array.isArray(batchId)
        ? batchId.at(-1)
        : batchId
    }

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
    const { patient_uuid, session_id } = request.query
    const { data } = request.session
    const { defaultBatchId, programme } = response.locals

    const patient = Patient.read(patient_uuid, data)
    const session = Session.read(session_id, data)
    const { injectionSite, ready } = data.preScreen

    const readyToVaccine = ready === 'true'
    const injectionSiteGiven = [
      VaccinationSite.ArmLeftUpper,
      VaccinationSite.ArmRightUpper
    ].includes(injectionSite)
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

    response.locals.back = getSessionPatientPath(session, patient)
    response.locals.startPath = startPath

    const vaccination = new Vaccination({
      location: session.formatted.location,
      urn: session.uri,
      patient_uuid,
      programme_pid: programme.pid,
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

    response.redirect(`${vaccination.uri}/new/${startPath}`)
  },

  update(request, response) {
    const { form, uuid } = request.params
    const { data, referrer } = request.session
    const { __ } = response.locals

    const vaccination = new Vaccination(
      Vaccination.read(uuid, data.wizard),
      data
    )
    request.flash('success', __(`vaccination.${form}.success`))

    vaccination.update(vaccination, data)

    // TODO: Decide if this is still the right approach
    // vaccination.captureAndFlow(data)

    // Clean up session data
    delete data.preScreen
    delete data.vaccination

    response.redirect(referrer || vaccination.uri)
  },

  readForm(request, response, next) {
    const { form, uuid } = request.params
    const { data, referrer } = request.session
    const { __, defaultBatchId, startPath, programme, session } =
      response.locals

    const vaccination = Vaccination.read(uuid, data.wizard)

    response.locals.vaccination = vaccination

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

    response.locals.batchItems = Batch.readAll(data)
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
    const { defaultBatchId, paths, programme, vaccination } = response.locals

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

    // Use default batch, if set
    if (defaultBatchId) {
      request.body.vaccination.batch_id = defaultBatchId
    }

    vaccination.update(request.body.vaccination, data.wizard)

    const redirect = paths.next || `${vaccination.uri}/new/check-answers`

    response.redirect(redirect)
  }
}
