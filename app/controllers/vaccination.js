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
import { Vaccination } from '../models/vaccination.js'
import { UserPresenter } from '../presenters/user.js'
import { VaccinePresenter } from '../presenters/vaccine.js'
import { today } from '../utils/date.js'

export const vaccinationController = {
  read(request, response, next, vaccination_uuid) {
    const { programme_id } = request.params

    const programme = Programme.findOne(programme_id, request.session.data)
    const vaccination = Vaccination.findOne(
      vaccination_uuid,
      request.session.data
    )

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

    // Setup wizard if not already setup
    let vaccination = Vaccination.findOne(vaccination_uuid, data.wizard)
    if (!vaccination) {
      vaccination = Vaccination.create(response.locals.vaccination, data.wizard)
    }

    // TODO: Use presenter
    response.locals.vaccination = new Vaccination(vaccination, data)

    // Show back link to referring page, else vaccination page
    response.locals.back = referrer || vaccination.uri

    response.render('vaccination/edit')
  },

  new(request, response) {
    const { account } = request.app.locals
    const { patientSession_uuid } = request.query
    const { data } = request.session

    const patientSession = PatientSession.findOne(patientSession_uuid, data)
    const { session, programme, vaccine, instruction } = patientSession
    const { identifiedBy, injectionSite, ready, selfId, suppliedBy_uid } =
      data.patientSession.preScreen

    // Check for default batch
    const defaultBatch = DefaultBatch.findAll(data)
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

    const vaccination = Vaccination.create(
      {
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
      },
      data.wizard
    )

    response.redirect(`${vaccination.uri}/new/${data.startPath}`)
  },

  update(type) {
    return (request, response) => {
      const { vaccination_uuid } = request.params
      const { data, referrer } = request.session
      const { __, session } = response.locals

      // Update session data
      const updates = {
        ...data.wizard.vaccinations[vaccination_uuid],
        ...request.body?.vaccination
      }

      if (type === 'new') {
        Vaccination.create(updates, data)
      } else {
        Vaccination.update(vaccination_uuid, updates, data)
      }

      // TODO: Use presenter
      const vaccination = Vaccination.findOne(vaccination_uuid, data)

      const patientSession = PatientSession.findOne(
        vaccination.patientSession_uuid,
        data
      )

      // Update number of vaccinations given
      if (type === 'new') {
        if (data?.token?.vaccinations?.[vaccination.vaccine.snomed]) {
          data.token.vaccinations[vaccination.vaccine.snomed] += 1
        } else {
          data.token.vaccinations = {
            [vaccination.vaccine_snomed]: 1
          }
        }
      }

      request.flash('success', __(`vaccination.${type}.success`, { session }))

      // Clean up session data
      delete data.batch_id
      delete data.defaultBatch
      delete data.patientSession_uuid
      delete data.startPath
      delete data.vaccination
      delete data.wizard

      // Update session data
      patientSession.patient.recordVaccination(vaccination)

      let next = referrer || vaccination.uri
      if (type === 'new') {
        next =
          patientSession.outstandingVaccinations.length === 0
            ? `${session.uri}/record`
            : patientSession.uri
      }

      response.redirect(next)
    }
  },

  readForm(type) {
    return (request, response, next) => {
      const { vaccination_uuid } = request.params
      const { data, referrer } = request.session
      const { __, programme } = response.locals

      let vaccination
      if (type === 'edit') {
        vaccination = Vaccination.findOne(vaccination_uuid, data)
      } else {
        vaccination = new Vaccination(
          Vaccination.findOne(vaccination_uuid, data.wizard),
          data
        )
      }

      response.locals.vaccination = vaccination

      // Historical vaccinations may not return a patient session
      const patientSession = PatientSession.findOne(
        data.patientSession_uuid,
        data
      )

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

      response.locals.batchItems = Batch.findAll(data)
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

      response.locals.userItems = UserPresenter.forAll(data)
        .map((user) => ({
          text: user.fullName,
          value: user.uid
        }))
        .sort((a, b) => a.text.localeCompare(b.text))

      response.locals.vaccineItems = VaccinePresenter.forAll(data)
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
    const { vaccination_uuid } = request.params
    let { paths, patientSession, vaccination } = response.locals

    // Add dose amount and vaccination outcome based on dosage answer
    const { dosage } = request.body.vaccination
    if (dosage) {
      request.body.vaccination.dose =
        dosage === 'half'
          ? vaccination.vaccine.dose / 2
          : vaccination.vaccine.dose
      request.body.vaccination.outcome =
        dosage === 'half'
          ? VaccinationOutcome.PartVaccinated
          : VaccinationOutcome.Vaccinated
    }

    vaccination = Vaccination.update(
      vaccination_uuid,
      request.body.vaccination,
      data.wizard
    )

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

    const redirect = paths.next || `${vaccination.uri}/new/check-answers`

    response.redirect(redirect)
  }
}
