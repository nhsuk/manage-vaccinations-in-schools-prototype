import { fakerEN_GB as faker } from '@faker-js/faker'

/**
 * @class Organisation
 * @property {string} [code] - ODS code
 * @property {string} [name] - Full name
 * @property {string} [email] - Email address
 * @property {string} [tel] - Phone number
 * @property {number} [consentDelay] - Weeks before session to request consent
 * @property {number} [reminderDelay] - Days before sending first reminder
 * @property {number} [reminderInterval] - Days between reminders
 * @property {number} [reminderMax] - Max number of reminders
 * @function ns - Namespace
 * @function uri - URL
 */
export class Organisation {
  constructor(options) {
    this.code = options?.code
    this.name = options?.name
    this.email = options?.email
    this.tel = options?.tel
    this.consentDelay = options?.consentDelay || 3
    this.reminderDelay = options?.reminderDelay || 7
    this.reminderInterval = options?.reminderInterval || 7
    this.reminderMax = options?.reminderMax || 4
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

  get formatted() {
    return {
      consentDelay: `${this.consentDelay} weeks before first session`,
      reminderDelay: `${this.reminderDelay} days`,
      reminderInterval: `${this.reminderInterval} days`
    }
  }

  get ns() {
    return 'organisation'
  }

  get uri() {
    return `/organisations/${this.code}`
  }
}
