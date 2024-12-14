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
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} uuid - UUID
 * @property {Date} [created] - Created date
 * @property {NoticeType} type - Notice type
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

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Notice>|undefined} Notices
   * @static
   */
  static readAll(context) {
    return Object.values(context.notices).map(
      (notice) => new Notice(notice, context)
    )
  }

  /**
   * Read
   *
   * @param {string} uuid - Notice UUID
   * @param {object} context - Context
   * @returns {Notice|undefined} Notice
   * @static
   */
  static read(uuid, context) {
    if (context?.notices) {
      return new Notice(context.notices[uuid], context)
    }
  }

  /**
   * Delete
   *
   * @param {object} context - Context
   */
  delete(context) {
    delete context.notices[this.uuid]
  }
}
