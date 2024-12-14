import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatDate, getToday } from '../utils/date.js'

import { Programme } from './programme.js'
import { Record } from './record.js'
import { User } from './user.js'
import { Vaccination } from './vaccination.js'

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
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} id - Import ID
 * @property {ImportStatus} status - Import status
 * @property {ImportType} type - Import type
 * @property {Date} created - Created date
 * @property {string} [created_user_uid] - User who created import
 * @property {string} [programme_pid] - Programme ID
 * @property {Array<string>} [record_nhsns] - Record NHS numbers
 * @property {number} [devoid] - Exact duplicate records found
 * @property {number} [duplicate] - Inexact duplicate records found
 * @property {number} [incomplete] - Incomplete records (no NHS number)
 * @property {number|undefined} [invalid] - Invalid records (no vaccination)
 */
export class Import {
  constructor(options, context) {
    this.context = context
    this.id = options?.id || faker.string.hexadecimal({ length: 8, prefix: '' })
    this.status = options?.status || ImportStatus.Processing
    this.type = options?.type || ImportType.Cohort
    this.created = options?.created ? new Date(options.created) : getToday()
    this.created_user_uid = options?.created_user_uid
    this.programme_pid = options?.programme_pid
    this.validations = options?.validations || []
    this.record_nhsns = options?.record_nhsns || []
    this.devoid = options?.devoid || 0
    this.duplicate = options?.duplicate || 0
    this.incomplete = options?.incomplete || 0
    this.invalid =
      this.type === ImportType.Report ? options?.invalid || 0 : undefined
  }

  /**
   * Get user who created import
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
      console.error('Import.created_user', error.message)
    }
  }

  /**
   * Get programme
   *
   * @returns {Programme} - User
   */
  get programme() {
    try {
      const programme = this.context?.programmes[this.programme_pid]
      if (programme) {
        return new Programme(programme)
      }
    } catch (error) {
      console.error('Import.programme', error.message)
    }
  }

  /**
   * Get imported records
   *
   * @returns {Array<Programme>} - Programmes
   */
  get records() {
    if (this.context?.records && this.record_nhsns) {
      return this.record_nhsns
        .map((nhsn) => new Record(this.context?.records[nhsn]))
        .map((record) => {
          record.vaccination = record.vaccination_uuids.map(
            (uuid) => new Vaccination(this.context.vaccinations[uuid])
          )[0]
          return record
        })
    }

    return []
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
      created_user: this.created_user?.fullName || '',
      programme: this.programme.type
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

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Import>|undefined} Imports
   * @static
   */
  static readAll(context) {
    return Object.values(context.imports).map(
      (_import) => new Import(_import, context)
    )
  }

  /**
   * Read
   *
   * @param {string} id - Import ID
   * @param {object} context - Context
   * @returns {Import|undefined} Import
   * @static
   */
  static read(id, context) {
    if (context.imports) {
      return new Import(context.imports[id], context)
    }
  }
}
