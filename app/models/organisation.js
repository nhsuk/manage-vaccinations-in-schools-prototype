import { fakerEN_GB as faker } from '@faker-js/faker'
import clinicsData from '../datasets/clinics.js'
import schoolsData from '../datasets/schools.js'
import { Clinic } from './clinic.js'
import { School } from './school.js'

export class OrganisationDefaults {
  static SessionOpenDelay = 3
  static SessionReminderDelay = 7
}

/**
 * @class Organisation
 * @property {string} [code] - ODS code
 * @property {string} [name] - Full name
 * @property {string} [email] - Email address
 * @property {string} [tel] - Phone number
 * @property {Array<string>} [ids] - Clinic organisation IDs
 * @property {Array<string>} [urns] - School URNs
 * @property {number} [sessionOpenDelay] - Weeks before session to request consent
 * @property {number} [sessionReminderDelay] - Days before sending first reminder
 */
export class Organisation {
  constructor(options) {
    this.code = options?.code
    this.name = options?.name
    this.email = options?.email
    this.tel = options?.tel
    this.ids = options?.ids || []
    this.urns = options?.urns || []
    this.sessionOpenDelay =
      options?.sessionOpenDelay || OrganisationDefaults.SessionOpenDelay
    this.sessionReminderDelay =
      options?.sessionReminderDelay || OrganisationDefaults.SessionReminderDelay
  }

  /**
   * Generate fake organisation
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
   * @returns {Array} - Clinics
   */
  get clinics() {
    return this.ids.map((id) => new Clinic(clinicsData[id]))
  }

  /**
   * Get schools
   * @returns {Array} - Schools
   */
  get schools() {
    return this.urns.map((urn) => new School(schoolsData[urn]))
  }

  /**
   * Get formatted values
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      sessionOpenDelay: `${this.sessionOpenDelay} weeks before first session`,
      sessionReminderDelay: `${this.sessionReminderDelay} days after first consent request`
    }
  }

  /**
   * Get namespace
   * @returns {string} - Namespace
   */
  get ns() {
    return 'organisation'
  }

  /**
   * Get URI
   * @returns {string} - URI
   */
  get uri() {
    return `/organisations/${this.code}`
  }
}
