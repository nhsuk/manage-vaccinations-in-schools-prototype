import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatDate, getToday } from '../utils/date.js'

import { Patient } from './patient.js'

export class NoticeType {
  static Deceased = 'Deceased'
  static Hidden = 'Hidden'
  static Invalid = 'Invalid'
  static Sensitive = 'Sensitive'
}

/**
 * @class Notice
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} uuid - UUID
 * @property {Date} date - Creation date
 * @property {NoticeType} type - Notice type
 * @property {string} name - Name
 * @property {string} [note] - Note
 * @property {string} patient_uuid - Patient notice applies to
 */
export class Notice {
  constructor(options, context) {
    this.context = context
    this.uuid = options.uuid || faker.string.uuid()
    this.created = options?.created ? new Date(options.created) : getToday()
    this.type = options.type
    this.patient_uuid = options.patient_uuid
  }

  static generate(patient, type) {
    return new Notice({
      type,
      patient_uuid: patient.uuid
    })
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
      console.error('Notice.patient', error.message)
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
        dateStyle: 'long'
      })
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'notice'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/notices/${this.uuid}`
  }
}
