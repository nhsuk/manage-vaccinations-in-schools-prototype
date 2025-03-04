import { fakerEN_GB as faker } from '@faker-js/faker'
import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import _ from 'lodash'

import schools from '../datasets/schools.js'
import vaccines from '../datasets/vaccines.js'
import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  today
} from '../utils/date.js'
import {
  formatLink,
  formatMillilitres,
  formatMarkdown,
  formatMonospace,
  formatTag
} from '../utils/string.js'

import { Batch } from './batch.js'
import { Patient } from './patient.js'
import { Programme } from './programme.js'
import { School } from './school.js'
import { Session } from './session.js'
import { User } from './user.js'
import { Vaccine, VaccineMethod } from './vaccine.js'

/**
 * @readonly
 * @enum {string}
 */
export const VaccinationOutcome = {
  Vaccinated: 'Vaccinated',
  PartVaccinated: 'Partially vaccinated',
  AlreadyVaccinated: 'Already had the vaccine',
  Contraindications: 'Had contraindications',
  Refused: 'Refused vaccine',
  AbsentSchool: 'Absent from school',
  AbsentSession: 'Absent from the session',
  Unwell: 'Unwell',
  NoConsent: 'Unable to contact parent',
  LateConsent: 'Consent received too late'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccinationMethod = {
  Nasal: 'Nasal spray',
  Intramuscular: 'Intramuscular (IM) injection',
  Subcutaneous: 'Subcutaneous injection'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccinationSite = {
  Nose: 'Nose',
  ArmLeftUpper: 'Left arm (upper position)',
  ArmLeftLower: 'Left arm (lower position)',
  ArmRightUpper: 'Right arm (upper position)',
  ArmRightLower: 'Right arm (lower position)',
  ThighLeft: 'Left thigh',
  ThighRight: 'Right thigh',
  Other: 'Other'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccinationProtocol = {
  PGD: 'Patient Group Directions'
}

/**
 * @class Vaccination
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} uuid - UUID
 * @property {Date} [createdAt] - Created date
 * @property {object} [createdAt_] - Created date (from `dateInput`)
 * @property {string} [createdBy_uid] - User who performed vaccination
 * @property {Date} [updatedAt] - Updated date
 * @property {string} [location] - Location
 * @property {VaccinationOutcome} [outcome] - Outcome
 * @property {VaccinationMethod} [injectionMethod] - Injection method
 * @property {VaccinationSite} [injectionSite] - Injection site on body
 * @property {number} [dose] - Dosage (ml)
 * @property {string} [sequence] - Dose sequence
 * @property {string} [protocol] - Protocol
 * @property {string} [note] - Note
 * @property {string} [school_urn] - School URN
 * @property {string} [session_id] - Session ID
 * @property {string} [patient_uuid] - Patient UUID
 * @property {string} [programme_pid] - Programme ID
 * @property {string} [batch_id] - Batch ID
 * @property {string} [vaccine_snomed] - Vaccine SNOMED code
 */
export class Vaccination {
  constructor(options, context) {
    this.context = context
    this.uuid = options?.uuid || faker.string.uuid()
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdAt_ = options?.createdAt_
    this.createdBy_uid = options?.createdBy_uid
    this.updatedAt = options?.updatedAt && new Date(options.updatedAt)
    this.location = options?.location || 'Unknown location'
    this.outcome = options?.outcome
    this.given =
      this.outcome === VaccinationOutcome.Vaccinated ||
      this.outcome === VaccinationOutcome.PartVaccinated ||
      this.outcome === VaccinationOutcome.AlreadyVaccinated
    this.injectionMethod = options?.injectionMethod
    this.injectionSite = options?.injectionSite
    this.dose = this.given ? options?.dose || '' : undefined
    this.sequence = options?.sequence
    this.protocol = this.given ? VaccinationProtocol.PGD : undefined
    this.note = options?.note || ''
    this.school_urn = options?.school_urn
    this.session_id = options?.session_id
    this.patient_uuid = options?.patient_uuid
    this.programme_pid = options?.programme_pid
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
   * @returns {string|undefined} - Method
   */
  get method() {
    if (!this.vaccine || !this.given) return

    if (this.vaccine.method === VaccineMethod.Nasal) {
      return VaccinationMethod.Nasal
    }

    return this.injectionMethod || ''
  }

  /**
   * Get anatomical site
   *
   * @returns {string|undefined} - Anatomical site
   */
  get site() {
    if (!this.vaccine || !this.given) return

    if (this.vaccine.method === VaccineMethod.Nasal) {
      return VaccinationSite.Nose
    }

    return this.injectionSite || ''
  }

  /**
   * Get patient
   *
   * @returns {Patient} - Patient
   */
  get patient() {
    try {
      const patient = this.context?.patients[this.patient_uuid]
      if (patient) {
        return new Patient(patient, this.context)
      }
    } catch (error) {
      console.error('Vaccination.patient', error)
    }
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
   * Get programme
   *
   * @returns {Programme} - Programme
   */
  get programme() {
    try {
      return Programme.read(this.programme_pid, this.context)
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
   * Get session
   *
   * @returns {Session} - Session
   */
  get session() {
    try {
      const session = this.context?.sessions[this.session_id]
      if (session) {
        return new Session(session)
      }
    } catch (error) {
      console.error('Vaccination.session', error.message)
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
      updatedAt: formatDate(this.updatedAt, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      batch: this.batch?.summary,
      batch_id: formatMonospace(this.batch_id),
      dose: formatMillilitres(this.dose),
      sequence,
      vaccine_snomed: this.vaccine_snomed && this.vaccine?.brand,
      note: formatMarkdown(this.note),
      outcomeStatus: formatTag(this.outcomeStatus),
      programme: this.programme && this.programme.nameTag,
      school: this.school && this.school.name
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      createdAt_date: formatLink(this.uri, this.formatted.createdAt_date)
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
    return `/programmes/${this.programme_pid}/vaccinations/${this.uuid}`
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
    if (context?.vaccinations) {
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

    // Remove patient context
    delete this.context

    // Delete original patient (with previous UUID)
    delete context.vaccinations[this.uuid]

    // Update context
    const updatedVaccination = Object.assign(this, updates)

    context.vaccinations[updatedVaccination.uuid] = updatedVaccination
  }
}
