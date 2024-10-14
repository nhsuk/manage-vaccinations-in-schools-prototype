import { fakerEN_GB as faker } from '@faker-js/faker'
import { formatDate, getToday } from '../utils/date.js'

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
 * @property {string} date - Creation date
 * @property {EventType} type - Activity type
 * @property {string} name - Name
 * @property {string} [note] - Note
 * @property {string} [user_uid] - User UUID
 * @property {object} [info_] - Temporary information storage object
 */
export class Event {
  constructor(options) {
    this.uuid = options.uuid || faker.string.uuid()
    this.date = options.date || getToday().toISOString()
    this.type = options.type
    this.name = options.name
    this.note = options.note
    this.user_uid = options?.user_uid
    this.info_ = options?.info_
  }

  /**
   * Get formatted values
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      date: formatDate(this.date, {
        dateStyle: 'long'
      })
    }
  }

  /**
   * Get namespace
   * @returns {string} - Namespace
   */
  get ns() {
    return 'event'
  }
}
