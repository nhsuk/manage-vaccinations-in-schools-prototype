import { fakerEN_GB as faker } from '@faker-js/faker'
import { formatDate, getToday } from '../utils/date.js'

export class ImportType {
  static Cohort = 'Child records'
  static Report = 'Vaccination records'
}

/**
 * @class National Immunisation and Vaccination System (NIVS) import
 * @property {string} id - Import ID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created import
 * @property {string} [programme_pid] - Programme ID
 * @property {Array<string>} [records] - Record NHS numbers
 * @property {number} [devoid] - Exact duplicate records found
 * @property {number} [duplicate] - Inexact duplicate records found
 * @property {number} [incomplete] - Incomplete records (no NHS number)
 * @property {number} [invalid] - Invalid records (no vaccination event)
 * @function ns - Namespace
 * @function uri - URL
 */
export class Import {
  constructor(options) {
    this.id = options?.id || faker.string.hexadecimal({ length: 8, prefix: '' })
    this.type = options?.type || ImportType.Cohort
    this.created = options?.created || getToday().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.programme_pid = options?.programme_pid
    this.records = options?.records || []
    this.devoid = options?.devoid || 0
    this.duplicate = options?.duplicate || 0
    this.incomplete = options?.incomplete || 0
    this.invalid =
      this.type === ImportType.Report ? options?.invalid || 0 : undefined
  }

  static generate(programme_pid, records, user) {
    return new Import({
      created_user_uid: user.uid,
      programme_pid,
      records
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

  get ns() {
    return 'import'
  }

  get uri() {
    return `/programmes/${this.programme_pid}/imports/${this.id}`
  }
}
