import { fakerEN_GB as faker } from '@faker-js/faker'
import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import schools from '../datasets/schools.js'
import {
  addDays,
  removeDays,
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  getToday
} from '../utils/date.js'
import { formatLink } from '../utils/string.js'
import { getConsentWindow } from '../utils/session.js'
import { programmeSchedule, ProgrammeStatus } from './programme.js'

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
  static Completed = 'Completed'
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
 * @property {SessionStatus} [status] - Status
 * @property {object} [consents] – (Unmatched) consent replies
 * @property {Array<string>} [programmes] - Programme PIDs
 * @function consentWindow - Consent window (open, opening or closed)
 * @function school - Get school details
 * @function location - Get location details
 * @function ns - Namespace
 * @function uri - URL
 */
export class Session {
  constructor(options) {
    this.id = options?.id || faker.helpers.replaceSymbols('###')
    this.created = options?.created || getToday().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.format = options?.format || SessionFormat.Routine
    this.urn = options?.urn
    this.date = options?.date
    this.time = options?.time
    this.open = options?.open
    this.reminder = options?.reminder
    this.close = options?.close
    this.status = options?.status || SessionStatus.Planned
    this.consents = options?.consents || {}
    this.programmes = options?.programmes || []
    // dateInput objects
    this.date_ = options?.date_
    this.open_ = options?.open_
    this.reminder_ = options?.reminder_
    this.close_ = options?.close_
  }

  static generate(urn, programme, user, options = {}) {
    const consentWindowDuration = 28

    let status
    if (programme.status === ProgrammeStatus.Current) {
      status = SessionStatus.Completed
    }
    if (programme.status === ProgrammeStatus.Completed) {
      status = SessionStatus.Completed
    } else if (programme.status === ProgrammeStatus.Planned) {
      status = SessionStatus.Planned
    } else {
      // Current programme, so session either active today, planned or completed
      status = options.isToday
        ? SessionStatus.Active
        : faker.helpers.arrayElement([
            SessionStatus.Planned,
            SessionStatus.Completed
          ])
    }

    let date
    switch (status) {
      case SessionStatus.Active:
        // Session is taking place today
        date = getToday()
        break
      case SessionStatus.Planned:
        // Session will take place according programme schedule
        let { from, to } = programmeSchedule[programme.cycle][programme.type]
        // Sessions start after first content window closes
        from = addDays(from, consentWindowDuration)
        date = faker.date.between({ from, to })
        break
      default:
        // Session took place about 7 days ago
        date = faker.date.recent({ days: 7 })
    }

    // Open consent request window 28 days before session
    const open = removeDays(date, consentWindowDuration)

    // Send reminders 7 days after consent opens
    const reminder = addDays(open, 7)

    // Close consent request window 3 days before session
    const close = removeDays(date, 3)

    // Session created 2 weeks before consent window opens
    const created = removeDays(open, 14)

    return new Session({
      created,
      created_user_uid: user.uuid,
      urn,
      date,
      time: faker.helpers.arrayElement(Object.values(SessionTime)),
      open: new Date(open),
      reminder: new Date(reminder),
      close: new Date(close),
      status,
      programmes: [programme.pid]
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
      return `${this.time} session at ${this.location.name} on ${this.formatted.date}`
    }
  }

  get summary() {
    return {
      location: `${this.location.name}</br>
      <span class="nhsuk-u-secondary-text-color">
        ${this.location.addressLine1},
        ${this.location.addressLevel1},
        ${this.location.postalCode}
      </span>`
    }
  }

  get link() {
    return {
      date: `<span class="nhsuk-u-secondary-text-color">
        ${formatLink(this.uri, this.formatted.date)}</br>
        ${this.time}
      </span>`,
      location: `${formatLink(this.uri, this.location.name)}</br>
        <span class="nhsuk-u-secondary-text-color">
          ${this.location.addressLine1},
          ${this.location.addressLevel1},
          ${this.location.postalCode}
        </span>`
    }
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
      programmes: prototypeFilters.formatList(this.programmes),
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
