import { fakerEN_GB as faker } from '@faker-js/faker'

import schools from '../datasets/schools.js'
import vaccines from '../datasets/vaccines.js'
import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  getToday
} from '../utils/date.js'
import {
  formatLink,
  formatMillilitres,
  formatMarkdown,
  formatMonospace
} from '../utils/string.js'

import { Batch } from './batch.js'
import { ConsentOutcome, Patient } from './patient.js'
import { Programme } from './programme.js'
import { School } from './school.js'
import { Session } from './session.js'
import { User } from './user.js'
import { Vaccine, VaccineMethod } from './vaccine.js'

export class VaccinationOutcome {
  static Vaccinated = 'Vaccinated'
  static PartVaccinated = 'Partially vaccinated'
  static AlreadyVaccinated = 'Already had the vaccine'
  static Contraindications = 'Had contraindications'
  static Refused = 'Refused vaccine'
  static AbsentSchool = 'Absent from school'
  static AbsentSession = 'Absent from the session'
  static Unwell = 'Unwell'
  static NoConsent = 'Unable to contact parent'
  static LateConsent = 'Consent received too late'
}

export class VaccinationMethod {
  static Nasal = 'Nasal spray'
  static Intramuscular = 'Intramuscular (IM) injection'
  static Subcutaneous = 'Subcutaneous injection'
}

export class VaccinationSequence {
  static P1 = 'First'
  static P2 = 'Second'
  static P3 = 'Third'
}

export class VaccinationSite {
  static Nose = 'Nose'
  static ArmLeftUpper = 'Left arm (upper position)'
  static ArmLeftLower = 'Left arm (lower position)'
  static ArmRightUpper = 'Right arm (upper position)'
  static ArmRightLower = 'Right arm (lower position)'
  static ThighLeft = 'Left thigh'
  static ThighRight = 'Right thigh'
  static Other = 'Other'
}

export class VaccinationProtocol {
  static PGD = 'Patient Group Directions'
}

/**
 * @class Vaccination
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} uuid - UUID
 * @property {Date} created - Vaccination date
 * @property {object} [created_] - Vaccination date (from `dateInput`)
 * @property {string} [created_user_uid] - User who performed vaccination
 * @property {Date} [updated] - Vaccination updated date
 * @property {string} [location] - Location
 * @property {VaccinationOutcome} [outcome] - Outcome
 * @property {VaccinationMethod} [injectionMethod] - Injection method
 * @property {VaccinationSite} [injectionSite] - Injection site on body
 * @property {number} [dose] - Dosage (ml)
 * @property {VaccinationSequence} [sequence] - Dose sequence
 * @property {string} [protocol] - Protocol
 * @property {string} [note] - Note
 * @property {string} [school_urn] - School URN
 * @property {string} [session_id] - Session ID
 * @property {string} [patient_uuid] - Patient UUID
 * @property {string} [programme_pid] - Programme ID
 * @property {string} [batch_id] - Batch ID
 * @property {string} [vaccine_gtin] - Vaccine GTIN
 */
export class Vaccination {
  constructor(options, context) {
    this.context = context
    this.uuid = options?.uuid || faker.string.uuid()
    this.created = options?.created ? new Date(options.created) : getToday()
    this.created_ = options?.created_
    this.created_user_uid = options?.created_user_uid
    this.updated = options?.updated ? new Date(options.updated) : undefined
    this.location = options?.location
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
    this.note = options?.note
    this.school_urn = options?.school_urn
    this.session_id = options?.session_id
    this.patient_uuid = options?.patient_uuid
    this.programme_pid = options?.programme_pid
    this.batch_id = this.given ? options?.batch_id || '' : undefined
    this.vaccine_gtin = options?.vaccine_gtin
  }

  /**
   * Generate fake vaccination
   *
   * @param {import('./patient.js').Patient} patient - Patient
   * @param {import('./programme.js').Programme} programme - Programme
   * @param {import('./session.js').Session} session - Session
   * @param {import('./batch.js').Batch} batch - Batch
   * @param {Array<import('./user.js').User>} users - Users
   * @returns {Vaccination} - Vaccination
   * @static
   */
  static generate(patient, programme, session, batch, users) {
    const user = faker.helpers.arrayElement(users)

    let injectionMethod
    let injectionSite
    let sequence

    let outcome
    if (patient.consent.value === ConsentOutcome.Given) {
      outcome = faker.helpers.weightedArrayElement([
        { value: VaccinationOutcome.Vaccinated, weight: 7 },
        { value: VaccinationOutcome.PartVaccinated, weight: 1 },
        { value: VaccinationOutcome.Refused, weight: 1 }
      ])
    } else {
      outcome = VaccinationOutcome.NoConsent
    }

    const vaccinated =
      outcome === VaccinationOutcome.Vaccinated ||
      outcome === VaccinationOutcome.PartVaccinated

    return new Vaccination({
      created: session.firstDate,
      created_user_uid: user.uid,
      outcome,
      location: session.location.name,
      programme_pid: programme.pid,
      session_id: session.id,
      patient_uuid: patient.uuid,
      vaccine_gtin: batch.vaccine_gtin,
      ...(vaccinated && {
        batch_id: batch.id,
        dose: vaccines[batch.vaccine_gtin].dose,
        sequence,
        injectionMethod,
        injectionSite
      })
    })
  }

  /**
   * Get created date for `dateInput`
   *
   * @returns {object|undefined} - `dateInput` object
   */
  get created_() {
    return convertIsoDateToObject(this.created)
  }

  /**
   * Set created date from `dateInput`
   *
   * @param {object} object - dateInput object
   */
  set created_(object) {
    if (object) {
      this.created = convertObjectToIsoDate(object)
    }
  }

  /**
   * Get batch
   *
   * @returns {Batch} - Batch
   */
  get batch() {
    try {
      const batch = this.context?.batches[this.batch_id]
      if (batch) {
        return new Batch(batch)
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
    if (!this.vaccine_gtin) return

    return new Vaccine(vaccines[this.vaccine_gtin])
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
        return new Patient(patient)
      }
    } catch (error) {
      console.error('Vaccination.patient', error.message)
    }
  }

  /**
   * Get user who performed vaccination
   *
   * @returns {User} - User
   */
  get created_user() {
    try {
      const user = this.context?.users[this.created_user_uid]
      if (user) {
        return new User(user)
      }
    } catch (error) {
      console.error('Vaccination.created_user', error.message)
    }
  }

  /**
   * Get programme
   *
   * @returns {Programme} - Programme
   */
  get programme() {
    try {
      const programme = this.context?.programmes[this.programme_pid]
      if (programme) {
        return new Programme(programme)
      }
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
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      created: formatDate(this.created, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      created_date: formatDate(this.created, {
        dateStyle: 'long'
      }),
      created_user: this.created_user?.fullName || '',
      updated: formatDate(this.updated, {
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
      vaccine_gtin: this.vaccine?.brandWithType,
      note: formatMarkdown(this.note),
      school: this?.school && this.school.name
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      vaccine_gtin: formatLink(this.uri, this.formatted.vaccine_gtin)
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
}
