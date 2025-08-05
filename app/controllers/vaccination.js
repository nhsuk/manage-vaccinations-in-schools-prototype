import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import wizard from '@x-govuk/govuk-prototype-wizard'
import _ from 'lodash'

import {
  VaccinationMethod,
  VaccinationOutcome,
  VaccinationProtocol,
  VaccinationSite,
  VaccineMethod,
  UserRole
} from '../enums.js'
import { Batch } from '../models/batch.js'
import { DefaultBatch } from '../models/default-batch.js'
import { PatientSession } from '../models/patient-session.js'
import { Programme } from '../models/programme.js'
import { User } from '../models/user.js'
import { Vaccination } from '../models/vaccination.js'
import { Vaccine } from '../models/vaccine.js'
import { today } from '../utils/date.js'

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
    const { account } = request.app.locals
    const { patientSession_uuid } = request.query
    const { data } = request.session

    const patientSession = PatientSession.read(patientSession_uuid, data)
    const { session, programme, vaccine, instruction } = patientSession
    const { identifiedBy, injectionSite, ready, selfId, suppliedBy_uid } =
      data.patientSession.preScreen

    // Check for default batch
    const defaultBatch = DefaultBatch.readAll(data)
      .filter((batch) => batch.vaccine_snomed === vaccine?.snomed)
      .find((batch) => batch.session_id === session?.id)

    const readyToVaccine = ['true', 'alternative'].includes(ready)
    const injectionSiteGiven = [
      VaccinationSite.ArmLeftUpper,
      VaccinationSite.ArmRightUpper
    ].includes(injectionSite)
    const isNasalSpray = vaccine?.method === VaccineMethod.Nasal
    const VaccinationSiteGiven = injectionSiteGiven || isNasalSpray

    switch (true) {
      case defaultBatch && readyToVaccine && VaccinationSiteGiven:
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
    if (defaultBatch) {
      data.defaultBatchId = defaultBatch.id
    }
    data.patientSession_uuid = patientSession_uuid

    // Used logged in user as vaccinator, or default to example user
    const createdBy_uid = account.uid || '000123456789'
    const role = account.role || UserRole.Nurse

    // Nurses always use PGD protocol
    let protocol = VaccinationProtocol.PGD

    // HCAs uses different protocol depending on vaccine and programme
    if (role === UserRole.HCA) {
      if (session.nationalProtocol && !isNasalSpray) {
        protocol = VaccinationProtocol.National
      }

      if (session.psdProtocol && instruction) {
        protocol = VaccinationProtocol.PSD
      }
    }

    const vaccination = new Vaccination({
      selfId,
      identifiedBy,
      location: session.formatted.location,
      programme_id: programme.id,
      school_urn: session.school_urn,
      patientSession_uuid: patientSession.uuid,
      vaccine_snomed: vaccine.snomed,
      createdAt: today(),
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
      ...(defaultBatch && {
        batch_id: defaultBatch.id
      })
    })

    vaccination.create(vaccination, data.wizard)

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

      const { patient } = PatientSession.read(
        vaccination.patientSession_uuid,
        data
      )

      // Add note on check answers page
      if (request.body?.vaccination?.note) {
        vaccination.note = request.body.vaccination.note
      }

      // Update number of vaccinations given
      data.token.vaccinations[vaccination.programme.type] += 1

      request.flash('success', __(`vaccination.${type}.success`, { session }))

      // Clean up session data
      delete data.batch_id
      delete data.defaultBatch
      delete data.patientSession_uuid
      delete data.startPath
      delete data.vaccination
      delete data.wizard

      // Update session data
      vaccination.create(vaccination, data)
      patient.recordVaccination(vaccination)

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
        .filter(([, value]) => value !== VaccinationSite.Other)
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
    if (request.body?.defaultBatchId) {
      let { defaultBatchId } = request.body
      defaultBatchId = Array.isArray(defaultBatchId)
        ? defaultBatchId.filter((item) => item !== '_unchecked')
        : defaultBatchId

      if (defaultBatchId) {
        DefaultBatch.addToSession(
          defaultBatchId,
          patientSession.session_id,
          data
        )
      }
    }

    vaccination.update(request.body.vaccination, data.wizard)

    const redirect = paths.next || `${vaccination.uri}/new/check-answers`

    response.redirect(redirect)
  }
}
