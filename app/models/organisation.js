import prototypeFilters from '@x-govuk/govuk-prototype-filters'

import { OrganisationDefaults } from '../enums.js'
import { today } from '../utils/date.js'
import { stringToBoolean } from '../utils/string.js'

import { Clinic } from './clinic.js'
import { School } from './school.js'

/**
 * @class Organisation
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} [code] - ODS code
 * @property {Date} [updatedAt] - Updated date
 * @property {string} [name] - Full name
 * @property {string} [email] - Email address
 * @property {string} [tel] - Phone number
 * @property {string} [privacyPolicyUrl] - Privacy policy URL
 * @property {number} [sessionOpenWeeks] - Weeks before session to request consent
 * @property {number} [sessionReminderWeeks] - Days before sending first reminder
 * @property {boolean} [sessionRegistration] - Should sessions have registration
 * @property {string} [password] - Shared password
 * @property {Array<string>} [clinic_ids] - Clinic organisation IDs
 * @property {Array<string>} [school_urns] - School URNs
 */
export class Organisation {
  constructor(options, context) {
    this.context = context
    this.code = options?.code
    this.updatedAt = options?.updatedAt && new Date(options.updatedAt)
    this.name = options?.name
    this.email = options?.email
    this.tel = options?.tel
    this.privacyPolicyUrl = options?.privacyPolicyUrl
    this.sessionOpenWeeks =
      Number(options?.sessionOpenWeeks) || OrganisationDefaults.SessionOpenWeeks
    this.sessionReminderWeeks =
      Number(options?.sessionReminderWeeks) ||
      OrganisationDefaults.SessionReminderWeeks
    this.sessionRegistration =
      stringToBoolean(options.sessionRegistration) ||
      OrganisationDefaults.SessionRegistration
    this.password = options?.password
    this.clinic_ids = options?.clinic_ids || []
    this.school_urns = options?.school_urns || []
  }

  /**
   * Get clinics
   *
   * @returns {Array<Clinic>} Clinics
   */
  get clinics() {
    try {
      return this?.clinic_ids
        .map((id) => new Clinic(this.context?.clinics[id]))
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      console.error('Organisation.clinics', error.message)
    }
  }

  /**
   * Get schools
   *
   * @returns {Array<School>} Schools
   */
  get schools() {
    try {
      return this?.school_urns
        .map((urn) => School.findOne(urn, this.context))
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      console.error('Organisation.schools', error.message)
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} Formatted values
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
   * @returns {string} Namespace
   */
  get ns() {
    return 'organisation'
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/organisations/${this.code}`
  }

  /**
   * Find all
   *
   * @param {object} context - Context
   * @returns {Array<Organisation>|undefined} Organisations
   * @static
   */
  static findAll(context) {
    return Object.values(context.organisations).map(
      (organisation) => new Organisation(organisation, context)
    )
  }

  /**
   * Find one
   *
   * @param {string} code - ODS code
   * @param {object} context - Context
   * @returns {Organisation|undefined} Organisation
   * @static
   */
  static findOne(code, context) {
    if (context?.organisations?.[code]) {
      return new Organisation(context.organisations[code], context)
    }
  }

  /**
   * Update
   *
   * @param {string} code - ODS code
   * @param {object} updates - Updates
   * @param {object} context - Context
   * @returns {Organisation} Organisation
   * @static
   */
  static update(code, updates, context) {
    const updatedOrganisation = Object.assign(
      Organisation.findOne(code, context),
      updates
    )
    updatedOrganisation.updatedAt = today()

    // Remove organisation context
    delete updatedOrganisation.context

    // Delete original organisation (with previous code)
    delete context.organisations[code]

    // Update context
    context.organisations[updatedOrganisation.code] = updatedOrganisation

    return updatedOrganisation
  }
}
