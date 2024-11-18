import { getToday } from '../utils/date.js'
import { stringToBoolean } from '../utils/string.js'

export class RegistrationOutcome {
  static Pending = 'Not registered yet'
  static Present = 'Attending today’s session'
  static Absent = 'Absent from today’s session'
  static Complete = 'Completed today’s session'
}

/**
 * @class Registration
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who registered patient
 * @property {string} [name] - Event name
 * @property {boolean} [registered] - Registration status
 */
export class Registration {
  constructor(options) {
    this.created = options?.created || getToday().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.name = options?.name
    this.registered = stringToBoolean(options?.registered)
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'registration'
  }
}
