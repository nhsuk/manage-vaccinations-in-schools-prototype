import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import wizard from '@x-govuk/govuk-prototype-wizard'
import _ from 'lodash'

import { Batch } from '../models/batch.js'
import { PatientSession } from '../models/patient-session.js'
import { Programme } from '../models/programme.js'
import { User, UserRole } from '../models/user.js'
import {
  Vaccination,
  VaccinationMethod,
  VaccinationOutcome,
  VaccinationProtocol,
  VaccinationSite
} from '../models/vaccination.js'
import { Vaccine, VaccineMethod } from '../models/vaccine.js'

export const vaccinationController = {
  read(request, response, next, vaccination_uuid) {
    const { programme_id } = request.params

    const programme = Programme.read(programme_id, request.session.data)
    const vaccination = Vaccination.read(vaccination_uuid, request.session.data)

    response.locals.vaccination = vaccination
    response.locals.programme = programme
    response.locals.session = vaccination?.session

    next()
  },

  redirect(request, response) {
    const { id, nhsn } = request.params

    response.redirect(`/sessions/${id}/${nhsn}`)
  },

  show(request, response) {
    response.render('vaccination/show')
  },

  edit(request, response) {
    const { vaccination_uuid } = request.params
    const { data, referrer } = request.session
    const { vaccination } = response.locals

    // Setup wizard if not already setup
    if (!Vaccination.read(vaccination_uuid, data.wizard)) {
      vaccination.create(vaccination, data.wizard)
    }

    // Show back link to referring page, else vaccination page
    response.locals.back = referrer || vaccination.uri
    response.locals.vaccination = new Vaccination(
      Vaccination.read(vaccination_uuid, data.wizard),
      data
    )

    response.render('vaccination/edit')
  },

  new(request, response) {
    const { patientSession_uuid } = request.query
    const { data } = request.session

    const { patient, session, programme, vaccine } = PatientSession.read(
      patientSession_uuid,
      data
    )
    let { identifiedBy, injectionSite, ready, selfId, suppliedBy_uid } =
      data.patientSession.preScreen

    // Check for default batch
    const defaultBatchId = session.defaultBatch_ids?.[vaccine.snomed]

    const readyToVaccine = ready === 'true'
    const injectionSiteGiven = [
      VaccinationSite.ArmLeftUpper,
      VaccinationSite.ArmRightUpper
    ].includes(injectionSite)
    const isNasalSpray = vaccine.method === VaccineMethod.Nasal
    const VaccinationSiteGiven = injectionSiteGiven || isNasalSpray

    switch (true) {
      case readyToVaccine && VaccinationSiteGiven && defaultBatchId:
        data.startPath = 'check-answers'
        break
      case readyToVaccine && VaccinationSiteGiven:
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

    // Used logged in user as vaccinator, or default to example user
    const createdBy_uid = data.token?.uid || '000123456789'
    const role = data.token?.role || UserRole.Nurse
    suppliedBy_uid = suppliedBy_uid || createdBy_uid

    // Nurses always use PGD protocol
    let protocol = VaccinationProtocol.PGD

    // HCAs uses different protocol depending on vaccine and programme
    if (role === UserRole.HCA) {
      if (session.nationalProtocol && !isNasalSpray) {
        protocol = VaccinationProtocol.National
      }

      // TODO: Only use PSD protocol if PSD enable and vaccine was prescribed
      // if (session.psdProtocol && isNasalSpray) {
      //   protocol = VaccinationProtocol.PSD
      // }
    }

    const vaccination = new Vaccination({
      selfId,
      identifiedBy,
      location: session.formatted.location,
      patient_uuid: patient.uuid,
      programme_id: programme.id,
      school_urn: session.school_urn,
      session_id: session.id,
      vaccine_snomed: vaccine.snomed,
      createdBy_uid,
      ...(injectionSite && {
        dose: vaccine.dose,
        injectionMethod: VaccinationMethod.Intramuscular,
        injectionSite,
        suppliedBy_uid,
        protocol,
        outcome: VaccinationOutcome.Vaccinated
      }),
      ...(isNasalSpray && {
        dose: vaccine.dose,
        injectionMethod: VaccinationMethod.Nasal,
        injectionSite: VaccinationSite.Nose,
        suppliedBy_uid,
        protocol,
        outcome: VaccinationOutcome.Vaccinated
      }),
      ...(programme.sequence && {
        sequence: programme.sequenceDefault
      }),
      ...(defaultBatchId && {
        batch_id: defaultBatchId
      })
    })

    vaccination.create(vaccination, data.wizard)
    patient.recordVaccination(vaccination)

    response.redirect(`${vaccination.uri}/new/${data.startPath}`)
  },

  update(type) {
    return (request, response) => {
      const { vaccination_uuid } = request.params
      const { data, referrer } = request.session
      const { __, session } = response.locals

      const vaccination = new Vaccination(
        Vaccination.read(vaccination_uuid, data.wizard),
        data
      )

      // Add note on check answers page
      if (request.body?.vaccination?.note) {
        vaccination.note = request.body.vaccination.note
      }

      request.flash('success', __(`vaccination.${type}.success`, { session }))

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
    }
  },

  readForm(type) {
    return (request, response, next) => {
      const { vaccination_uuid } = request.params
      const { data, referrer } = request.session
      const { __, programme } = response.locals

      let vaccination
      if (type === 'edit') {
        vaccination = Vaccination.read(vaccination_uuid, data)
      } else {
        vaccination = new Vaccination(
          Vaccination.read(vaccination_uuid, data.wizard),
          data
        )
      }

      response.locals.vaccination = vaccination

      // Historical vaccinations may not return a patient session
      const patientSession = PatientSession.read(data.patientSession_uuid, data)

      response.locals.patientSession = patientSession
      response.locals.session = patientSession?.session

      const journey = {
        [`/`]: {},
        ...(data.startPath === 'decline'
          ? {
              [`/${vaccination_uuid}/${type}/decline`]: {},
              [`/${vaccination_uuid}/${type}/check-answers`]: {}
            }
          : {
              [`/${vaccination_uuid}/${type}/administer`]: {},
              [`/${vaccination_uuid}/${type}/batch-id`]: () => {
                return !data.defaultBatchId
              },
              ...(!patientSession?.session?.address && {
                [`/${vaccination_uuid}/${type}/location`]: {}
              }),
              [`/${vaccination_uuid}/${type}/check-answers`]: {}
            }),
        [`/${vaccination_uuid}`]: {}
      }

      response.locals.paths = {
        ...wizard(journey, request),
        ...(type === 'edit' && {
          back: `${vaccination.uri}/edit`,
          next: `${vaccination.uri}/edit`
        })
      }

      // If first page in journey, return to page that initiated recording
      const currentPath = request.path.split('/').at(-1)
      if (currentPath === data.startPath) {
        response.locals.paths.back = referrer || vaccination.uri
      }

      response.locals.batchItems = Batch.readAll(data)
        .filter(
          (batch) => batch.vaccine.snomed === patientSession?.vaccine.snomed
        )
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

      response.locals.sequenceItems =
        programme.sequence &&
        Object.entries(programme.sequence).map(([index, value]) => {
          const ordinal = prototypeFilters.ordinal(Number(index) + 1)
          return {
            text: `${_.startCase(ordinal)} dose`,
            value
          }
        })

      response.locals.userItems = User.readAll(data)
        .map((user) => ({
          text: user.fullName,
          value: user.uid
        }))
        .sort((a, b) => a.text.localeCompare(b.text))

      response.locals.vaccineItems = Vaccine.readAll(data)
        .filter((vaccine) => programme.type.includes(vaccine.type))
        .map((vaccine) => ({
          text: vaccine.brandWithType,
          value: vaccine.snomed
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
    }
  },

  showForm(type) {
    return (request, response) => {
      const { view } = request.params

      response.render(`vaccination/form/${view}`, { type })
    }
  },

  updateForm(request, response) {
    const { data } = request.session
    const { paths, patientSession, vaccination } = response.locals
    const { vaccine } = vaccination

    // Add dose amount and vaccination outcome based on dosage answer
    const { dosage } = request.body.vaccination
    if (dosage) {
      request.body.vaccination.dose =
        dosage === 'half' ? vaccine.dose / 2 : vaccine.dose
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

      patientSession.session.update(
        { defaultBatch_ids: { [vaccine.snomed]: batch_id } },
        data
      )
    }

    vaccination.update(request.body.vaccination, data.wizard)

    const redirect = paths.next || `${vaccination.uri}/new/check-answers`

    response.redirect(redirect)
  }
}
