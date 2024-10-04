import { fakerEN_GB as faker } from '@faker-js/faker'
import schoolsData from '../datasets/schools.js'
import { stringToBoolean } from '../utils/string.js'
import { School } from './school.js'

export class OrganisationDefaults {
  static SessionOpenDelay = 3
  static SessionReminderDelay = 7
  static SessionReminderInt = 7
  static SessionReminderMax = 4
}

/**
 * @class Organisation
 * @property {string} [code] - ODS code
 * @property {string} [name] - Full name
 * @property {string} [email] - Email address
 * @property {string} [tel] - Phone number
 * @property {Array<string>} [urns] - School URNs
 * @property {number} [sessionOpenDelay] - Weeks before session to request consent
 * @property {number} [sessionReminderDelay] - Days before sending first reminder
 * @property {number} [sessionReminderInt] - Days between reminders
 * @property {number} [sessionReminderMax] - Max number of reminders
 * @property {boolean} [sessionReminderMethod] - Preferred reminder method
 * @function ns - Namespace
 * @function uri - URL
 */
export class Organisation {
  constructor(options) {
    this.code = options?.code
    this.name = options?.name
    this.email = options?.email
    this.tel = options?.tel
    this.urns = options?.urns || []
    this.sessionOpenDelay =
      options?.sessionOpenDelay || OrganisationDefaults.SessionOpenDelay
    this.sessionReminderDelay =
      options?.sessionReminderDelay || OrganisationDefaults.SessionReminderDelay
    this.sessionReminderInt =
      options?.sessionReminderInt || OrganisationDefaults.SessionReminderInt
    this.sessionReminderMax =
      options?.sessionReminderMax || OrganisationDefaults.SessionReminderMax
    this.sessionReminderMethod =
      stringToBoolean(options?.sessionReminderMethod) || false
  }

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

  get schools() {
    return this.urns.map((urn) => new School(schoolsData[urn]))
  }

  get formatted() {
    return {
      sessionOpenDelay: `${this.sessionOpenDelay} weeks before first session`,
      sessionReminderDelay: `${this.sessionReminderDelay} days after first consent request`,
      sessionReminderInt: `${this.sessionReminderInt} days`
    }
  }

  get ns() {
    return 'organisation'
  }

  get uri() {
    return `/organisations/${this.code}`
  }
}
