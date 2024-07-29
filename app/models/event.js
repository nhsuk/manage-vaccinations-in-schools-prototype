import { fakerEN_GB as faker } from '@faker-js/faker'
import { formatDate } from '../utils/date.js'

export class EventType {
  static Select = 'Select'
  static Invite = 'Invite'
  static Consent = 'Consent'
  static Screen = 'Screen'
  static Capture = 'Capture'
  static Record = 'Record'
}

/**
 * @class Audit event
 * @property {string} uuid - UUID
 * @property {string} date - Creation date
 * @property {EventType} type - Activity type
 * @property {string} name - Name
 * @property {string} [note] - Notes
 * @property {string} [user_uid] - User UUID
 * @function ns - Namespace
 * @function uri - URL
 */
export class Event {
  constructor(options) {
    this.uuid = options.uuid || faker.string.uuid()
    this.date = options.date || new Date().toISOString()
    this.type = options.type
    this.name = options.name
    this.note = options.note
    this.user_uid = options?.user_uid
    // Information storage object
    this.info_ = options.info_
  }

  get formatted() {
    return {
      date: formatDate(this.date, {
        dateStyle: 'long'
      })
    }
  }

  get ns() {
    return 'event'
  }

  get uri() {
    return `/events/${this.uuid}`
  }
}
