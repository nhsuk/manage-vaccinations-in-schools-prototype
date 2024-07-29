import { fakerEN_GB as faker } from '@faker-js/faker'
import schools from '../datasets/schools.js'
import {
  addDays,
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate
} from '../utils/date.js'
import { formatLink } from '../utils/string.js'
import { getConsentWindow } from '../utils/session.js'

export class ConsentWindow {
  static Opening = 'Opening'
  static Open = 'Open'
  static Closed = 'Closed'
}

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

export class SessionStatus {
  static Planned = 'Planned'
  static Active = 'In progress'
  static Completed = 'Past'
}

/**
 * @class Session
 * @property {string} id - ID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created session
 * @property {SessionFormat} [format] - Format
 * @property {string} [urn] - School
 * @property {object} [date] - Date
 * @property {SessionTime} [time] - Time of day
 * @property {object} [open] - Date consent window opens
 * @property {number} [reminder] - Date to send reminders
 * @property {object} [close] - Date consent window closes
 * @property {SessionStatus} [status] - Status (planned, in progress, archived)
 * @property {object} [consents] – (Unmatched) consent replies
 * @property {string} [campaign_uid] - Campaign UID
 * @function consentWindow - Consent window (open, opening or closed)
 * @function school - Get school details
 * @function location - Get location details
 * @function ns - Namespace
 * @function uri - URL
 */
export class Session {
  constructor(options) {
    this.id = options?.id || `${options.campaign_uid}-${this.#id}`
    this.created = options?.created || new Date().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.format = options?.format
    this.urn = options?.urn
    this.date = options?.date
    this.time = options?.time
    this.open = options?.open
    this.reminder = options?.reminder
    this.close = options?.close
    this.status = options?.status
    this.consents = options?.consents || {}
    this.campaign_uid = options?.campaign_uid
    // dateInput objects
    this.date_ = options?.date_
    this.open_ = options?.open_
    this.reminder_ = options?.reminder_
    this.close_ = options?.close_
  }

  static generate(urn, campaign, user, options = {}) {
    // Create session 7 days after campaign created
    const created = addDays(campaign.created, 7)

    // Unless session is today, randomly generate a planned or completed session
    const status = options.isToday
      ? SessionStatus.Active
      : faker.helpers.arrayElement([
          SessionStatus.Planned,
          SessionStatus.Completed
        ])

    let date
    switch (status) {
      case SessionStatus.Active:
        // Session is taking place today
        date = new Date()
        break
      case SessionStatus.Planned:
        // Session takes places around 90 days from creation date
        date = addDays(created, faker.number.int({ min: 70, max: 100 }))
        break
      default:
        // Session took place about 7 days ago
        date = faker.date.recent({ days: 7 })
    }

    // Open consent request window 60 days before session
    const open = addDays(date, -60)

    // Send reminders 7 days after consent opens
    const reminder = addDays(open, 7)

    // Close consent request window 3 days before session
    const close = addDays(date, -3)

    return new Session({
      created,
      created_user_uid: user.uuid,
      format: faker.helpers.arrayElement(Object.values(SessionFormat)),
      urn,
      date,
      time: faker.helpers.arrayElement(Object.values(SessionTime)),
      open: new Date(open),
      reminder: new Date(reminder),
      close: new Date(close),
      status,
      campaign_uid: campaign.uid
    })
  }

  #id = faker.helpers.replaceSymbols('###')

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

  get consentWindow() {
    return getConsentWindow(this)
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

  get summary() {
    return `<span class="nhsuk-u-secondary-text-color">
      ${formatLink(this.uri, this.location.name)}</br>
      ${this.location.addressLine1},
      ${this.location.addressLevel1},
      ${this.location.postalCode}
    </span>`
  }

  get formatted() {
    let consentWindow
    const consentDateStyle = { day: 'numeric', month: 'long' }
    switch (this.consentWindow.value) {
      case ConsentWindow.Opening:
        consentWindow = `Opens ${formatDate(this.open, consentDateStyle)}`
        break
      case ConsentWindow.Closed:
        consentWindow = `Closed ${formatDate(this.close, consentDateStyle)}`
        break
      default:
        consentWindow = `Open until ${formatDate(this.close, consentDateStyle)}`
    }

    return {
      date: formatDate(this.date, {
        dateStyle: 'full'
      }),
      open: formatDate(this.open, {
        dateStyle: 'full'
      }),
      reminder: formatDate(this.reminder, {
        dateStyle: 'full'
      }),
      close: formatDate(this.date, {
        dateStyle: 'full'
      }),
      urn: this.location.name,
      consentWindow
    }
  }

  get ns() {
    return 'session'
  }

  get uri() {
    return `/sessions/${this.id}`
  }
}
