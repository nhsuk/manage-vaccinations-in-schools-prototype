export class RegistrationOutcome {
  static Pending = 'Not registered yet'
  static Present = 'Attending session'
  static Absent = 'Absent from session'
  static Complete = 'Completed session'
}

/**
 * @class Registration
 * @property {string} created - Created date
 * @property {string} [created_user_uuid] - User who registered patient
 * @property {string} [name] - Event name
 * @property {string} [registered] - Registration status
 * @function ns - Namespace
 */
export class Registration {
  constructor(options) {
    this.created = options?.created || new Date().toISOString()
    this.created_user_uuid = options?.created_user_uuid
    this.name = options?.name
    this.registered = options?.registered
  }

  get ns() {
    return 'registration'
  }
}
