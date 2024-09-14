import { fakerEN_GB as faker } from '@faker-js/faker'
import vaccines from '../datasets/vaccines.js'
import { Batch } from './batch.js'
import { ConsentOutcome } from './patient.js'
import { ProgrammeType } from './programme.js'
import { Vaccine, VaccineMethod } from './vaccine.js'
import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  getToday
} from '../utils/date.js'
import {
  formatMillilitres,
  formatMarkdown,
  formatMonospace
} from '../utils/string.js'

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
 * @property {string} uuid - UUID
 * @property {string} created - Vaccination date
 * @property {string} [created_user_uid] - User who performed vaccination
 * @property {string} [updated] - Vaccination updated date
 * @property {string} [location] - Location
 * @property {string} [urn] - School URN
 * @property {VaccinationOutcome} [outcome] - Outcome
 * @property {VaccinationMethod} [injectionMethod] - Injection method
 * @property {VaccinationSite} [injectionSite] - Injection site on body
 * @property {number} [dose] - Dosage (ml)
 * @property {VaccinationSequence} [sequence] - Dose sequence
 * @property {string} [protocol] - Protocol
 * @property {string} [notes] - Notes
 * @property {string} [programme_pid] - Programme ID
 * @property {string} [session_id] - Session ID
 * @property {string} [patient_uuid] - Patient UUID
 * @property {string} [batch_id] - Batch ID
 * @property {string} [batch_expires] - Batch expiry date
 * @property {string} [vaccine_gtin] - Vaccine GTIN
 * @property {boolean} [_pending] - Pending upload
 * @function ns - Namespace
 * @function uri - URL
 */
export class Vaccination {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.created = options?.created || getToday().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.updated = options?.updated
    this.location = options?.location
    this.urn = options?.urn
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
    this.notes = options?.notes
    this.programme_pid = options?.programme_pid
    this.session_id = options?.session_id
    this.patient_uuid = options?.patient_uuid
    this.batch_id = this.given ? options?.batch_id || '' : undefined
    this.batch_expires = this.given ? options?.batch_expires || '' : undefined
    this.vaccine_gtin = this.given ? options?.vaccine_gtin || '' : undefined
    // Upload mocking
    this._pending = options?._pending || false
    // dateInput objects
    this.created_ = options?.created_
  }

  static generate(patient, programme, session, location, users) {
    const user = users[faker.number.int({ min: 0, max: 19 })]

    let injectionMethod
    let injectionSite
    let sequence
    let vaccine_gtin
    switch (programme.type) {
      case ProgrammeType.HPV:
        injectionMethod = VaccinationMethod.Subcutaneous
        injectionSite = VaccinationSite.ArmRightUpper
        sequence = VaccinationSequence.P1
        vaccine_gtin = '00191778001693'
        break
      case ProgrammeType.MenACWY:
        injectionMethod = VaccinationMethod.Subcutaneous
        injectionSite = VaccinationSite.ArmRightUpper
        vaccine_gtin = '5415062370568'
        break
      case ProgrammeType.TdIPV:
        injectionMethod = VaccinationMethod.Subcutaneous
        injectionSite = VaccinationSite.ArmRightUpper
        vaccine_gtin = '3664798042948'
        break
      case ProgrammeType.Flu:
      default:
        vaccine_gtin = '05000456078276'
        break
    }

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

    const batch = Batch.generate({ vaccine_gtin })

    return new Vaccination({
      created: session.date,
      created_user_uid: user.uid,
      outcome,
      location,
      programme_pid: programme.pid,
      session_id: session.id,
      patient_uuid: patient.uuid,
      ...(vaccinated && {
        batch_id: batch.id,
        batch_expires: batch.expires,
        dose: vaccines[vaccine_gtin].dose,
        sequence,
        injectionMethod,
        injectionSite,
        vaccine_gtin
      })
    })
  }

  get created_() {
    return convertIsoDateToObject(this.created)
  }

  set created_(object) {
    if (object) {
      this.created = convertObjectToIsoDate(object)
    }
  }

  get updated_() {
    return convertIsoDateToObject(this.updated)
  }

  set updated_(object) {
    if (object) {
      this.updated = convertObjectToIsoDate(object)
    }
  }

  get batch_expires_() {
    return convertIsoDateToObject(this.batch_expires)
  }

  set batch_expires_(object) {
    if (object) {
      this.batch_expires = convertObjectToIsoDate(object)
    }
  }

  get formatted() {
    return {
      created: formatDate(this.created, {
        dateStyle: 'long',
        timeStyle: 'short',
        hourCycle: 'h12'
      }),
      created_date: formatDate(this.created, {
        dateStyle: 'long'
      }),
      updated: formatDate(this.updated, {
        dateStyle: 'long',
        timeStyle: 'short',
        hourCycle: 'h12'
      }),
      batch_id: formatMonospace(this.batch_id),
      batch_expires: formatDate(this.batch_expires, {
        dateStyle: 'long'
      }),
      dose: formatMillilitres(this.dose),
      vaccine_gtin: this.vaccine?.brandWithType,
      notes: formatMarkdown(this.notes)
    }
  }

  get vaccine() {
    if (!this.vaccine_gtin || !this.given) return

    return new Vaccine(vaccines[this.vaccine_gtin])
  }

  get method() {
    if (!this.vaccine || !this.given) return

    if (this.vaccine.method == VaccineMethod.Nasal) {
      return VaccinationMethod.Nasal
    }

    return this.injectionMethod || ''
  }

  get site() {
    if (!this.vaccine || !this.given) return

    if (this.vaccine.method == VaccineMethod.Nasal) {
      return VaccinationSite.Nose
    }

    return this.injectionSite || ''
  }

  get ns() {
    return 'vaccination'
  }

  get uri() {
    return `/programmes/${this.programme_pid}/vaccinations/${this.uuid}`
  }
}
