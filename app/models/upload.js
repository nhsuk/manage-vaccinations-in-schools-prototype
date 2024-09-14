import { fakerEN_GB as faker } from '@faker-js/faker'
import { formatDate, getToday } from '../utils/date.js'

/**
 * @class National Immunisation and Vaccination System (NIVS) upload
 * @property {string} id - Upload ID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created upload
 * @property {string} [programme_pid] - Programme ID
 * @property {Array<string>} [vaccinations] - Vaccination UUIDs
 * @property {Array<string>} [incomplete] - Incomplete records (no NHS number)
 * @property {Array<string>} [invalid] - Invalid records (no vaccination event)
 * @property {Array<string>} [exact] - Exact duplicate records found
 * @property {Array<string>} [inexact] - Inexact duplicate records found
 * @function ns - Namespace
 * @function uri - URL
 */
export class Upload {
  constructor(options) {
    this.id = options?.id || faker.string.hexadecimal({ length: 8, prefix: '' })
    this.created = options?.created || getToday().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.programme_pid = options?.programme_pid
    this.vaccinations = options?.vaccinations || []
    this.incomplete = options?.incomplete || []
    this.invalid = options?.invalid || []
    this.exact = options?.exact || []
    this.inexact = options?.inexact || []
  }

  static generate(programme, user, vaccinations) {
    const created = faker.date.recent()

    return new Upload({
      created,
      created_user_uid: user.uid,
      programme_pid: programme.uid,
      vaccinations
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
    return 'upload'
  }

  get uri() {
    return `/programmes/${this.programme_pid}/uploads/${this.id}`
  }
}
