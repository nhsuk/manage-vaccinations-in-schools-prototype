import { fakerEN_GB as faker } from '@faker-js/faker'
import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import { isBefore } from 'date-fns'
import _ from 'lodash'

import schools from '../datasets/schools.js'
import vaccines from '../datasets/vaccines.js'
import {
  VaccinationMethod,
  VaccinationOutcome,
  VaccinationProtocol,
  VaccinationSite,
  VaccinationSyncStatus,
  VaccineMethod
} from '../enums.js'
import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  today
} from '../utils/date.js'
import {
  formatIdentifier,
  formatLink,
  formatLinkWithSecondaryText,
  formatMillilitres,
  formatMarkdown,
  formatMonospace,
  formatTag,
  stringToBoolean,
  formatWithSecondaryText
} from '../utils/string.js'

import { Batch } from './batch.js'
import { PatientSession } from './patient-session.js'
import { Programme } from './programme.js'
import { School } from './school.js'
import { User } from './user.js'
import { Vaccine } from './vaccine.js'

/**
 * @class Vaccination
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} uuid - UUID
 * @property {Date} [createdAt] - Created date
 * @property {object} [createdAt_] - Created date (from `dateInput`)
 * @property {string} [createdBy_uid] - User who performed vaccination
 * @property {string} [suppliedBy_uid] - Who supplied the vaccine
 * @property {Date} [updatedAt] - Updated date
 * @property {Date} [nhseSyncedAt] - Date synced with NHS England API
 * @property {string} [location] - Location
 * @property {boolean} [selfId] - Child confirmed their identity?
 * @property {object} [identifiedBy] - Who identified child
 * @property {string} [identifiedBy.name] - Name of identifier
 * @property {string} [identifiedBy.relationship] - Relationship of identifier
 * @property {VaccinationOutcome} [outcome] - Outcome
 * @property {VaccinationMethod} [injectionMethod] - Injection method
 * @property {VaccinationSite} [injectionSite] - Injection site on body
 * @property {number} [dose] - Dosage (ml)
 * @property {string} [sequence] - Dose sequence
 * @property {string} [protocol] - Protocol
 * @property {string} [note] - Note
 * @property {string} [school_urn] - School URN
 * @property {string} [patientSession_uuid] - Patient session UUID
 * @property {string} [programme_id] - Programme ID
 * @property {string} [batch_id] - Batch ID
 * @property {string} [vaccine_snomed] - Vaccine SNOMED code
 */
export class Vaccination {
  constructor(options, context) {
    this.context = context
    this.uuid = options?.uuid || faker.string.uuid()
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdAt_ = options?.createdAt_
    this.nhseSyncedAt = options?.nhseSyncedAt
      ? new Date(options.nhseSyncedAt)
      : undefined
    this.createdBy_uid = options?.createdBy_uid
    this.suppliedBy_uid = options?.suppliedBy_uid
    this.updatedAt = options?.updatedAt && new Date(options.updatedAt)
    this.location = options?.location || 'Unknown location'
    this.selfId = options?.selfId && stringToBoolean(options.selfId)
    this.identifiedBy = this.selfId !== true && options?.identifiedBy
    this.outcome = options?.outcome
    this.given =
      this.outcome === VaccinationOutcome.Vaccinated ||
      this.outcome === VaccinationOutcome.PartVaccinated ||
      this.outcome === VaccinationOutcome.AlreadyVaccinated
    this.injectionMethod = options?.injectionMethod
    this.injectionSite = options?.injectionSite
    this.dose = this.given ? options?.dose || '' : undefined
    this.sequence = options?.sequence
    this.protocol = this.given
      ? options?.protocol || VaccinationProtocol.PGD
      : undefined
    this.note = options?.note || ''
    this.school_urn = options?.school_urn
    this.patientSession_uuid = options?.patientSession_uuid
    this.programme_id = options?.programme_id
    this.batch_id = this.given ? options?.batch_id || '' : undefined
    this.vaccine_snomed = options?.vaccine_snomed
  }

  /**
   * Get created date for `dateInput`
   *
   * @returns {object|undefined} - `dateInput` object
   */
  get createdAt_() {
    return convertIsoDateToObject(this.createdAt)
  }

  /**
   * Set created date from `dateInput`
   *
   * @param {object} object - dateInput object
   */
  set createdAt_(object) {
    if (object) {
      this.createdAt = convertObjectToIsoDate(object)
    }
  }

  /**
   * Get batch
   *
   * @returns {Batch} - Batch
   */
  get batch() {
    try {
      if (this.batch_id) {
        return new Batch(this.batch_id, this.context)
      }
    } catch (error) {
      console.error('Vaccination.batch', error.message)
    }
  }

  /**
   * Get batch expiry date for `dateInput`
   *
   * @returns {object|undefined} - `dateInput` object
   */
  get batch_expiry_() {
    return convertIsoDateToObject(this.batch.expiry)
  }

  /**
   * Set batch expiry date from `dateInput`
   *
   * @param {object} object - dateInput object
   */
  set batch_expiry_(object) {
    if (object) {
      this.context.batches[this.batch_id].expiry =
        convertObjectToIsoDate(object)
    }
  }

  /**
   * Get vaccine
   *
   * @returns {object|undefined} - Vaccine
   */
  get vaccine() {
    if (this.vaccine_snomed) {
      return new Vaccine(vaccines[this.vaccine_snomed])
    }
  }

  /**
   * Get method
   *
   * @returns {VaccinationMethod|undefined} - Method
   */
  get method() {
    if (!this.vaccine || !this.given) return

    if (this.vaccine.method === VaccineMethod.Nasal) {
      this.injectionMethod = VaccinationMethod.Nasal
    }

    if (
      this.vaccine.method === VaccineMethod.Injection &&
      this.injectionMethod === VaccinationMethod.Nasal
    ) {
      // Change previously set injection site to intramuscular (good default)
      this.injectionMethod = VaccinationMethod.Intramuscular
    }

    return this.injectionMethod
  }

  /**
   * Get anatomical site
   *
   * @returns {VaccinationSite|undefined} - Anatomical site
   */
  get site() {
    if (!this.vaccine || !this.given) return

    if (this.method === VaccinationMethod.Nasal) {
      // Method is nasal, so site is ‘Nose’
      this.injectionSite = VaccinationSite.Nose
    }

    if (
      this.method !== VaccinationMethod.Nasal &&
      this.injectionSite === VaccinationSite.Nose
    ) {
      // Reset any previously set injection site as can no longer be ‘Nose’
      this.injectionSite = null
    }

    return this.injectionSite
  }

  /**
   * Get patient session
   *
   * @returns {PatientSession} - Patient session
   */
  get patientSession() {
    try {
      return PatientSession.read(this.patientSession_uuid, this.context)
    } catch (error) {
      console.error('Instruction.patientSession', error.message)
    }
  }

  /**
   * Get patient
   *
   * @returns {import('../models/patient.js').Patient} - Patient
   */
  get patient() {
    return this.patientSession.patient
  }

  /**
   * Get session
   *
   * @returns {import('../models/session.js').Session} - Session
   */
  get session() {
    return this.patientSession.session
  }

  /**
   * Get user who performed vaccination
   *
   * @returns {User} - User
   */
  get createdBy() {
    try {
      if (this.createdBy_uid) {
        return User.read(this.createdBy_uid, this.context)
      }
    } catch (error) {
      console.error('Vaccination.createdBy', error.message)
    }
  }

  /**
   * Get user who supplied the vaccine
   *
   * @returns {User} - User
   */
  get suppliedBy() {
    try {
      if (this.suppliedBy_uid) {
        return User.read(this.suppliedBy_uid, this.context)
      }
    } catch (error) {
      console.error('Vaccination.suppliedBy', error.message)
    }
  }

  /**
   * Get programme
   *
   * @returns {Programme} - Programme
   */
  get programme() {
    try {
      return Programme.read(this.programme_id, this.context)
    } catch (error) {
      console.error('Vaccination.programme', error.message)
    }
  }

  /**
   * Get school
   *
   * @returns {School|undefined} - School
   */
  get school() {
    if (this.school_urn) {
      return new School(schools[this.school_urn])
    }
  }

  /**
   * Get outcome status properties
   *
   * @returns {object} - Status properties
   */
  get outcomeStatus() {
    let colour
    switch (this.outcome) {
      case VaccinationOutcome.Vaccinated:
      case VaccinationOutcome.PartVaccinated:
      case VaccinationOutcome.AlreadyVaccinated:
        colour = 'green'
        break
      default:
        colour = 'red'
    }

    return {
      colour,
      text: this.outcome
    }
  }

  /**
   * Get status of sync with NHS England API
   *
   * @returns {VaccinationSyncStatus} - Status
   */
  get sync() {
    const updatedAt = this.updatedAt || this.createdAt
    const oneMinuteAgo = new Date(new Date().getTime() - 1000 * 60)

    switch (true) {
      case !this.given:
        return VaccinationSyncStatus.NotSynced
      case this.nhseSyncedAt > updatedAt:
        return VaccinationSyncStatus.Synced
      case isBefore(updatedAt, oneMinuteAgo):
        return VaccinationSyncStatus.Failed
      default:
        return VaccinationSyncStatus.Pending
    }
  }

  /**
   * Get sync status properties
   *
   * @returns {object} - Sync status properties
   */
  get syncStatus() {
    let colour
    const nhseSyncedAt = formatDate(this.nhseSyncedAt, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    let description = this.nhseSyncedAt ? `Last synced: ${nhseSyncedAt}` : ''

    switch (this.sync) {
      case VaccinationSyncStatus.NotSynced:
        colour = 'grey'
        break
      case VaccinationSyncStatus.Synced:
        colour = 'green'
        break
      case VaccinationSyncStatus.Failed:
        colour = 'red'
        description = `Contact Mavis support team<br>${description}`
        break
      default:
        colour = 'blue'
        break
    }

    return {
      colour,
      text: this.sync,
      description
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    let sequence
    if (this.sequence && this.programme?.sequence) {
      sequence = this.programme.sequence.indexOf(this.sequence)
      sequence = prototypeFilters.ordinal(Number(sequence) + 1)
      sequence = `${_.startCase(sequence)} dose`
    }

    return {
      createdAt: formatDate(this.createdAt, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      createdAt_date: formatDate(this.createdAt, {
        dateStyle: 'long'
      }),
      createdBy: this.createdBy?.fullName || '',
      suppliedBy: this.suppliedBy?.fullName || '',
      updatedAt: formatDate(this.updatedAt, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      syncStatus: formatWithSecondaryText(
        formatTag(this.syncStatus),
        this.syncStatus.description,
        true
      ),
      batch: this.batch?.summary,
      batch_id: formatMonospace(this.batch_id),
      dose: formatMillilitres(this.dose),
      sequence,
      vaccine_snomed: this.vaccine_snomed && this.vaccine?.brand,
      note: formatMarkdown(this.note),
      outcomeStatus: formatTag(this.outcomeStatus),
      programme: this.programme && this.programme.nameTag,
      school: this.school && this.school.name,
      identifiedBy: this.selfId
        ? 'The child'
        : formatIdentifier(this.identifiedBy)
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      createdAt_date: formatLink(this.uri, this.formatted.createdAt_date),
      fullName: formatLink(this.uri, this.patient.fullName),
      fullNameAndNhsn: formatLinkWithSecondaryText(
        this.uri,
        this.patient.fullName,
        this.patient.formatted.nhsn || 'Missing NHS number'
      )
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'vaccination'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/programmes/${this.programme_id}/vaccinations/${this.uuid}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Vaccination>|undefined} Vaccinations
   * @static
   */
  static readAll(context) {
    return Object.values(context.vaccinations).map(
      (vaccination) => new Vaccination(vaccination, context)
    )
  }

  /**
   * Read
   *
   * @param {string} uuid - Vaccination UUID
   * @param {object} context - Context
   * @returns {Vaccination|undefined} Vaccination
   * @static
   */
  static read(uuid, context) {
    if (context?.vaccinations?.[uuid]) {
      return new Vaccination(context.vaccinations[uuid], context)
    }
  }

  /**
   * Create
   *
   * @param {Vaccination} vaccination - Vaccination
   * @param {object} context - Context
   */
  create(vaccination, context) {
    vaccination = new Vaccination(vaccination)

    // Update context
    context.vaccinations = context.vaccinations || {}
    context.vaccinations[vaccination.uuid] = vaccination
  }

  /**
   * Update
   *
   * @param {object} updates - Updates
   * @param {object} context - Context
   */
  update(updates, context) {
    this.updatedAt = new Date()

    // Make sure sync isn't always successful
    const syncSuccess = Math.random() > 0.3
    if (syncSuccess && this.given) {
      this.nhseSyncedAt = today(Math.random() * 60 * 5)
    }

    // Remove patient context
    delete this.context

    // Delete original patient (with previous UUID)
    delete context.vaccinations[this.uuid]

    // Update context
    const updatedVaccination = Object.assign(this, updates)

    context.vaccinations[updatedVaccination.uuid] = updatedVaccination
  }
}
