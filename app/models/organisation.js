import prototypeFilters from '@x-govuk/govuk-prototype-filters'

import { Clinic } from './clinic.js'
import { School } from './school.js'

export class OrganisationDefaults {
  static SessionOpenWeeks = 3
  static SessionReminderWeeks = 1
}

/**
 * @class Organisation
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} [code] - ODS code
 * @property {string} [name] - Full name
 * @property {string} [email] - Email address
 * @property {string} [tel] - Phone number
 * @property {number} [sessionOpenWeeks] - Weeks before session to request consent
 * @property {number} [SessionReminderWeeks] - Days before sending first reminder
 * @property {string} [password] - Shared password
 * @property {Array<string>} [clinic_ids] - Clinic organisation IDs
 * @property {Array<string>} [school_urns] - School URNs
 */
export class Organisation {
  constructor(options, context) {
    this.context = context
    this.code = options?.code
    this.name = options?.name
    this.email = options?.email
    this.tel = options?.tel
    this.sessionOpenWeeks =
      options?.sessionOpenWeeks || OrganisationDefaults.SessionOpenWeeks
    this.sessionReminderWeeks =
      options?.sessionReminderWeeks || OrganisationDefaults.SessionReminderWeeks
    this.password = options?.password
    this.clinic_ids = options?.clinic_ids || []
    this.school_urns = options?.school_urns || []
  }

  /**
   * Get clinics
   *
   * @returns {Array<Clinic>} - Clinics
   */
  get clinics() {
    try {
      return this?.clinic_ids.map((id) => new Clinic(this.context?.clinics[id]))
    } catch (error) {
      console.error('Organisation.clinics', error.message)
    }
  }

  /**
   * Get schools
   *
   * @returns {Array<School>} - Schools
   */
  get schools() {
    try {
      return this?.school_urns.map(
        (urn) => new School(this.context?.schools[urn])
      )
    } catch (error) {
      console.error('Organisation.schools', error.message)
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    const sessionOpenWeeks = prototypeFilters.plural(
      this.sessionOpenWeeks,
      'week'
    )
    const sessionReminderWeeks = prototypeFilters.plural(
      this.sessionReminderWeeks,
      'week'
    )

    return {
      sessionOpenWeeks: `Send ${sessionOpenWeeks} before first session`,
      sessionReminderWeeks: `Send ${sessionReminderWeeks} before each session`
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'organisation'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/organisations/${this.code}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Organisation>|undefined} Organisations
   * @static
   */
  static readAll(context) {
    return Object.values(context.organisations).map(
      (organisation) => new Organisation(organisation, context)
    )
  }

  /**
   * Read
   *
   * @param {string} code - ODS code
   * @param {object} context - Context
   * @returns {Organisation|undefined} Organisation
   * @static
   */
  static read(code, context) {
    if (context?.organisation) {
      return new Organisation(context.organisations[code], context)
    }
  }

  /**
   * Update
   *
   * @param {object} updates - Updates
   * @param {object} context - Context
   */
  update(updates, context) {
    this.updated = new Date()

    // Remove organisation context
    delete this.context

    // Delete original organisation (with previous code)
    delete context.organisations[this.code]

    // Update context
    const updatedOrganisation = Object.assign(this, updates)
    context.organisations[updatedOrganisation.code] = updatedOrganisation
  }
}
