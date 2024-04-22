import { fakerEN_GB as faker } from '@faker-js/faker'
import schools from '../datasets/schools.js'
import {
  addDays,
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate
} from '../utils/date.js'

export class SessionFormat {
  static Routine = 'A routine session in school'
  static Catchup = 'A catch-up session in school'
  static Clinic = 'A clinic'
}

export class SessionTime {
  static Morning = 'Morning'
  static Afternoon = 'Afternoon'
  static AllDay = 'All day'
}

/**
 * @class Session
 * @property {string} id - ID
 * @property {string} created - Created date
 * @property {string} [created_user_uuid] - User who created session
 * @property {Array} cohort - Cohort
 * @property {SessionFormat} [format] - Format
 * @property {string} [urn] - School
 * @property {object} [date] - Date
 * @property {SessionTime} [time] - Time of day
 * @property {object} [open] - Date consent window opens
 * @property {number} [reminder] - Date to send reminders
 * @property {object} [close] - Date consent window closes
 * @property {string} [campaign_uuid] - Campaign UUID
 * @function school - Get school details
 * @function location - Get location details
 * @function ns - Namespace
 * @function uri - URL
 */
export class Session {
  constructor(options) {
    this.id = options?.id || faker.helpers.replaceSymbols('??##')
    this.created = options?.created || new Date().toISOString()
    this.created_user_uuid = options?.created_user_uuid
    this.cohort = options?.cohort || []
    this.format = options?.format
    this.urn = options?.urn
    this.date = options?.date
    this.time = options?.time
    this.open = options?.open
    this.reminder = options?.reminder
    this.close = options?.close
    this.campaign_uuid = options?.campaign_uuid
    // dateInput objects
    this.date_ = options?.date_
    this.open_ = options?.open_
    this.reminder_ = options?.reminder_
    this.close_ = options?.close_
  }

  static generate(urn, cohort, campaign, user) {
    // Ensure cohort only contains unique values
    cohort = [...new Set(cohort)]

    // Create session 7 days after campaign created
    const created = addDays(campaign.created, 7)

    // Session takes places around 90 days from now
    const date = addDays(created, faker.number.int({ min: 70, max: 91 }))

    // Open consent request window 60 days before session
    const open = addDays(date, -60)

    // Send reminders 7 days after consent opens
    const reminder = addDays(open, 7)

    // Close consent request window 3 days before session
    const close = addDays(date, -3)

    return new Session({
      created,
      created_user_uuid: user.uuid,
      cohort,
      format: faker.helpers.arrayElement(Object.values(SessionFormat)),
      urn,
      date,
      time: faker.helpers.arrayElement(Object.values(SessionTime)),
      open: new Date(open),
      reminder: new Date(reminder),
      close: new Date(close),
      campaign_uuid: campaign.uuid
    })
  }

  get date_() {
    return convertIsoDateToObject(this.date)
  }

  set date_(object) {
    if (object) {
      this.date = convertObjectToIsoDate(object)
    }
  }

  get open_() {
    return convertIsoDateToObject(this.open)
  }

  set open_(object) {
    if (object) {
      this.open = convertObjectToIsoDate(object)
    }
  }

  get reminder_() {
    return convertIsoDateToObject(this.reminder)
  }

  set reminder_(object) {
    if (object) {
      this.reminder = convertObjectToIsoDate(object)
    }
  }

  get close_() {
    return convertIsoDateToObject(this.close)
  }

  set close_(object) {
    if (object) {
      this.close = convertObjectToIsoDate(object)
    }
  }

  get school() {
    if (this.urn) {
      return schools[this.urn]
    }
  }

  get location() {
    if (this.school) {
      return {
        name: this.school.name,
        addressLine1: this.school.address_line1,
        addressLine2: this.school.address_line2,
        addressLevel1: this.school.address_level1,
        postalCode: this.school.postal_code
      }
    }
  }

  get name() {
    if (this.location) {
      const date = formatDate(this.date, { dateStyle: 'full' })

      return `${this.time} session at ${this.location.name} on ${date}`
    }
  }

  get ns() {
    return 'session'
  }

  get uri() {
    return `/sessions/${this.id}`
  }
}
