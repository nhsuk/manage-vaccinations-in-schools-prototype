import { fakerEN_GB as faker } from '@faker-js/faker'
import { formatDate, getToday } from '../utils/date.js'

export class ImportType {
  static Cohort = 'Child records'
  static Report = 'Vaccination records'
}

export class ImportStatus {
  static Processing = 'Processing'
  static Complete = 'Completed'
  static Invalid = 'Invalid'
}

/**
 * @class National Immunisation and Vaccination System (NIVS) import
 * @property {string} id - Import ID
 * @property {ImportStatus} - Import status
 * @property {ImportType} -  Import type
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created import
 * @property {string} [programme_pid] - Programme ID
 * @property {Array<string>} [records] - Record NHS numbers
 * @property {number} [devoid] - Exact duplicate records found
 * @property {number} [duplicate] - Inexact duplicate records found
 * @property {number} [incomplete] - Incomplete records (no NHS number)
 * @property {number} [invalid] - Invalid records (no vaccination event)
 * @function type - Import type
 * @function ns - Namespace
 * @function uri - URL
 */
export class Import {
  constructor(options) {
    this.id = options?.id || faker.string.hexadecimal({ length: 8, prefix: '' })
    this.status = options?.status || ImportStatus.Processing
    this.type = options?.type || ImportType.Cohort
    this.created = options?.created || getToday().toISOString()
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

  static generate(programme, records, user, type) {
    const created = faker.date.recent({ days: 14, refDate: programme.start })

    let devoid
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
    } else if (records === undefined) {
      // Simulate file with no new records
      devoid = 101
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
      invalid: type === ImportType.Report && 99
    })
  }

  get formatted() {
    return {
      created: formatDate(this.created, {
        dateStyle: 'long',
        timeStyle: 'short',
        hourCycle: 'h12'
      })
    }
  }

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

  get ns() {
    return 'import'
  }

  get uri() {
    return `/programmes/${this.programme_pid}/imports/${this.id}`
  }
}
