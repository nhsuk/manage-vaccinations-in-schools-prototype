import { fakerEN_GB as faker } from '@faker-js/faker'

import schools from '../datasets/schools.js'
import { Patient } from '../models/patient.js'
import { formatDate, getToday } from '../utils/date.js'

export class MoveSource {
  static Cohort = 'Cohort record'
  static Consent = 'Consent response'
  static School = 'Class list'
  static External = 'Another SAIS team'
}

/**
 * @class Move
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} uuid - UUID
 * @property {Date} created - Reported date
 * @property {string} from - Current school URN (moving from)
 * @property {string} to - Proposed school URN (moving to)
 * @property {MoveSource} source - Reporting source
 * @property {boolean} ignore - Ignore report
 * @property {string} patient_uuid - Patient UUID
 */
export class Move {
  constructor(options, context) {
    this.context = context
    this.uuid = options?.uuid || faker.string.uuid()
    this.created = options?.created ? new Date(options.created) : getToday()
    this.from = options?.from
    this.to = options?.to
    this.source = options?.source
    this.ignore = options?.ignore || false
    this.patient_uuid = options?.patient_uuid
  }

  /**
   * Get patient
   *
   * @returns {Patient|undefined} - Patient
   */
  get patient() {
    try {
      const patient = this.context?.patients[this.patient_uuid]
      if (patient) {
        return new Patient(patient)
      }
    } catch (error) {
      console.error('Move.patient', error.message)
    }
  }

  get movement() {
    return `<span><span class="nhsuk-u-secondary-text-color nhsuk-u-font-size-16">${this.source} updated</span><br>${this.formatted.from}<br><span class="nhsuk-u-secondary-text-color nhsuk-u-font-size-16">to</span> ${this.formatted.to}</span>`
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      created: formatDate(this.created, { dateStyle: 'long' }),
      from: schools[this.from].name,
      to: schools[this.to].name
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'move'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/moves/${this.uuid}`
  }
}
