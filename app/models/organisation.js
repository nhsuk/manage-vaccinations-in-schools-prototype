import { fakerEN_GB as faker } from '@faker-js/faker'
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
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} [code] - ODS code
 * @property {string} [name] - Full name
 * @property {string} [email] - Email address
 * @property {string} [tel] - Phone number
 * @property {Array<string>} [ids] - Clinic organisation IDs
 * @property {Array<string>} [urns] - School URNs
 * @property {number} [sessionOpenWeeks] - Weeks before session to request consent
 * @property {number} [SessionReminderWeeks] - Days before sending first reminder
 * @property {string} [password] - Shared password
 */
export class Organisation {
  constructor(options, context) {
    this.context = context
    this.code = options?.code
    this.name = options?.name
    this.email = options?.email
    this.tel = options?.tel
    this.ids = options?.ids || []
    this.urns = options?.urns || []
    this.sessionOpenWeeks =
      options?.sessionOpenWeeks || OrganisationDefaults.SessionOpenWeeks
    this.sessionReminderWeeks =
      options?.sessionReminderWeeks || OrganisationDefaults.SessionReminderWeeks
    this.password =
      options?.password ||
      faker.internet.password({
        memorable: true,
        length: 16
      })
  }

  /**
   * Generate fake organisation
   *
   * @returns {Organisation} - Organisation
   * @static
   */
  static generate() {
    const code = faker.helpers.replaceSymbols('???')
    const name = `${faker.location.county()} Child Immunisation Service`

    return new Organisation({
      code,
      name,
      email: faker.internet
        .email({
          firstName: code,
          lastName: 'sais',
          provider: 'example.nhs.net'
        })
        .toLowerCase(),
      tel: '01### ######'.replace(/#+/g, (m) => faker.string.numeric(m.length))
    })
  }

  /**
   * Get clinics
   *
   * @returns {Array<Clinic>} - Clinics
   */
  get clinics() {
    try {
      return this?.ids.map((id) => new Clinic(this.context?.clinics[id]))
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
      return this?.urns.map((urn) => new School(this.context?.schools[urn]))
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
}
