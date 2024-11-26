import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatDate, getToday } from '../utils/date.js'

export class ImportType {
  static Cohort = 'Child records'
  static School = 'Class list'
  static Report = 'Vaccination records'
}

export class ImportStatus {
  static Processing = 'Processing'
  static Complete = 'Completed'
  static Invalid = 'Invalid'
}

/**
 * @class Import
 * @property {string} id - Import ID
 * @property {ImportStatus} status - Import status
 * @property {ImportType} type - Import type
 * @property {Date} created - Created date
 * @property {string} [created_user_uid] - User who created import
 * @property {string} [programme_pid] - Programme ID
 * @property {Array<string>} [records] - Record NHS numbers
 * @property {number} [devoid] - Exact duplicate records found
 * @property {number} [duplicate] - Inexact duplicate records found
 * @property {number} [incomplete] - Incomplete records (no NHS number)
 * @property {number|undefined} [invalid] - Invalid records (no vaccination)
 */
export class Import {
  constructor(options) {
    this.id = options?.id || faker.string.hexadecimal({ length: 8, prefix: '' })
    this.status = options?.status || ImportStatus.Processing
    this.type = options?.type || ImportType.Cohort
    this.created = options?.created ? new Date(options.created) : getToday()
    this.created_user_uid = options?.created_user_uid
    this.programme_pid = options?.programme_pid
    this.validations = options?.validations || []
    this.records = options?.records || []
    this.devoid = options?.devoid || 0
    this.duplicate = options?.duplicate || 0
    this.incomplete = options?.incomplete || 0
    this.invalid =
      this.type === ImportType.Report ? options?.invalid || 0 : undefined
  }

  /**
   * Generate fake import
   *
   * @param {import('./programme.js').Programme} programme - Programme
   * @param {Array|boolean|undefined} records - Records
   * @param {import('./user.js').User} user - User
   * @param {ImportType} [type] - Import type
   * @returns {Import} - Import
   * @static
   */
  static generate(programme, records, user, type) {
    const created = faker.date.recent({ days: 14, refDate: programme.start })

    let validations
    let status = ImportStatus.Complete

    if (records === false) {
      // Simulate invalid file
      status = ImportStatus.Invalid
      validations = {
        3: {
          CHILD_FIRST_NAME: 'is required but missing',
          CHILD_POSTCODE:
            '‘24 High Street’ should be a postcode, like SW1A 1AA',
          CHILD_NHS_NUMBER:
            '‘QQ 12 34 56 A’ should be a valid NHS number, like 485 777 3456'
        },
        8: {
          CHILD_DOB: '‘Simon’ should be formatted as YYYY-MM-DD'
        }
      }
    }

    return new Import({
      created,
      created_user_uid: user.uid,
      programme_pid: programme.pid,
      status,
      type,
      validations,
      records,
      devoid: 99,
      invalid: 99
    })
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      created: formatDate(this.created, {
        dateStyle: 'long',
        timeStyle: 'short',
        hourCycle: 'h12'
      })
    }
  }

  /**
   * Get status for `tag`
   *
   * @returns {object} - `tag` object
   */
  get statusTag() {
    let colour
    switch (this.status) {
      case ImportStatus.Complete:
        colour = 'green'
        break
      case ImportStatus.Invalid:
        colour = 'red'
        break
      default:
        colour = 'blue'
    }

    return {
      classes: `nhsuk-tag--${colour}`,
      text: this.status
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'import'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/programmes/${this.programme_pid}/imports/${this.id}`
  }
}
