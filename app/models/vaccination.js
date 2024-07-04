import { fakerEN_GB as faker } from '@faker-js/faker'
import vaccines from '../datasets/vaccines.js'
import {
  convertIsoDateToObject,
  convertObjectToIsoDate
} from '../utils/date.js'

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
 * @property {string} uuid - UUID
 * @property {string} created - Vaccination date
 * @property {string} [created_user_uid] - User who performed vaccination
 * @property {string} [location] - Location
 * @property {VaccinationOutcome} [outcome] - Outcome
 * @property {VaccinationMethod} [method] - Administration method
 * @property {VaccinationSite} [site] - Site on body
 * @property {number} [dose] - Dosage (ml)
 * @property {string} protocol - Protocol
 * @property {string} [notes] - Notes
 * @property {string} [session_id] - Session ID
 * @property {string} [patient_nhsn] - Patient NHS number
 * @property {string} [batch_id] - Batch ID
 * @property {string} [vaccine_gtin] - Vaccine GTIN
 * @function ns - Namespace
 * @function uri - URL
 */
export class Vaccination {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.created = options?.created || new Date().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.location = options?.location
    this.outcome = options?.outcome
    this.method = options?.method
    this.site = options?.site
    this.dose = options?.dose
    this.protocol = options?.batch_id && VaccinationProtocol.PGD
    this.notes = options?.notes
    this.session_id = options?.session_id
    this.patient_nhsn = options?.patient_nhsn
    this.batch_id = options?.batch_id
    this.vaccine_gtin = options?.vaccine_gtin
    // dateInput objects
    this.created_ = options?.created_
  }

  get created_() {
    return convertIsoDateToObject(this.created)
  }

  set created_(object) {
    if (object) {
      this.created = convertObjectToIsoDate(object)
    }
  }

  get formattedCreated() {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'long',
      timeStyle: 'short',
      hourCycle: 'h12'
    }).format(new Date(this.created))
  }

  get formattedDose() {
    return this.dose && `${this.dose} ml`
  }

  get formattedName() {
    if (this.vaccine_gtin) {
      const vaccine = vaccines[this.vaccine_gtin]
      return `${vaccine.brand} (${vaccine.name})`
    }
  }

  get ns() {
    return 'vaccination'
  }

  get uri() {
    return `/sessions/${this.session_id}/${this.patient_nhsn}/vaccinations/${this.uuid}`
  }
}
