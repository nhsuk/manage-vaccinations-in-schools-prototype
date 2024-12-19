import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatDate, today } from '../utils/date.js'

export class EventType {
  static Select = 'Select'
  static Invite = 'Invite'
  static Remind = 'Remind'
  static Consent = 'Consent'
  static Screen = 'Screen'
  static Capture = 'Capture'
  static Record = 'Record'
  static Notice = 'Notice'
}

/**
 * @class Audit event
 * @property {string} uuid - UUID
 * @property {Date} [createdAt] - Created date
 * @property {string} [createdBy_uid] - User who created event
 * @property {EventType} type - Activity type
 * @property {string} name - Name
 * @property {string} [note] - Note
 * @property {object} [info_] - Temporary information storage object
 */
export class AuditEvent {
  constructor(options) {
    this.uuid = options.uuid || faker.string.uuid()
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdBy_uid = options?.createdBy_uid
    this.type = options.type
    this.name = options.name
    this.note = options.note
    this.info_ = options?.info_
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      createdAt: formatDate(this.createdAt, {
        dateStyle: 'long'
      }),
      datetime: formatDate(this.createdAt, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'event'
  }
}
