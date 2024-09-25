import { fakerEN_GB as faker } from '@faker-js/faker'
import { isAfter, isBefore } from 'date-fns'
import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import schools from '../datasets/schools.js'
import {
  addDays,
  removeDays,
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  getToday,
  isBetweenDates
} from '../utils/date.js'
import { formatLink, formatList } from '../utils/string.js'
import { getConsentWindow } from '../utils/session.js'
import { ProgrammeStatus, programmeTypes } from './programme.js'

export class ConsentWindow {
  static Opening = 'Opening'
  static Open = 'Open'
  static Closed = 'Closed'
}

export class SessionFormat {
  static School = 'A routine session in school'
  static Clinic = 'A clinic'
}

export class SessionStatus {
  static Unplanned = 'No sessions planned'
  static Planned = 'Sessions planned'
  static Active = 'Sessions in progress'
  static Completed = 'Sessions completed'
}

/**
 * @class Session
 * @property {string} id - ID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created session
 * @property {SessionFormat} [format] - Format
 * @property {string} [urn] - School
 * @property {Array<string>} [dates] - Date
 * @property {object} [open] - Date consent window opens
 * @property {number} [reminder] - Date to send reminders
 * @property {object} [consents] – (Unmatched) consent replies
 * @property {Array<string>} [programmes] - Programme PIDs
 * @function close - Date consent window closes
 * @function consentWindow - Consent window (open, opening or closed)
 * @function status - Status
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
    this.format = options?.format || SessionFormat.School
    this.urn = options?.urn
    this.dates = options?.dates || []
    this.open = options?.open
    this.reminder = options?.reminder
    this.consents = options?.consents || {}
    this.programmes = options?.programmes || []
    // dateInput objects
    this.dates_ = options?.dates_
    this.open_ = options?.open_
    this.reminder_ = options?.reminder_
  }

  static generate(urn, programme, user, options = {}) {
    let status
    if (programme.status === ProgrammeStatus.Completed) {
      status = SessionStatus.Completed
    } else if (programme.status === ProgrammeStatus.Planned) {
      status = SessionStatus.Planned
    } else {
      // Current programme, so session either active today, planned or completed
      status = options.isToday
        ? SessionStatus.Active
        : faker.helpers.arrayElement([
            SessionStatus.Completed,
            SessionStatus.Planned,
            SessionStatus.Unplanned
          ])
    }

    let dates = []
    let reminder
    let open
    let created
    let firstSessionDate
    switch (status) {
      case SessionStatus.Active:
        // Session is taking place today
        firstSessionDate = getToday()
        break
      case SessionStatus.Planned:
        // Session will take place according programme schedule
        let { to } = programmeTypes[programme.type].schedule
        // Sessions start after first content window closes
        firstSessionDate = faker.date.between({ from: getToday(), to })
        break
      case SessionStatus.Unplanned:
        firstSessionDate = false
        break
      default:
        // Session took place about 7 days before today
        firstSessionDate = faker.date.recent({ days: 7, refDate: getToday() })
    }

    if (firstSessionDate) {
      dates.push(firstSessionDate)

      // TODO: Create 1-4 dates for a session
      const hasSecondDate = faker.datatype.boolean(0.5)
      if (hasSecondDate) {
        const secondSessionDate = addDays(firstSessionDate, 1)
        dates.push(secondSessionDate)
      }

      // Open consent request window 28 days before first session
      open = new Date(removeDays(firstSessionDate, 28))

      // Send reminders 7 days after consent opens
      reminder = new Date(addDays(open, 7))

      // Session created 2 weeks before consent window opens
      created = new Date(removeDays(open, 14))
    }

    return new Session({
      created,
      created_user_uid: user.uuid,
      urn,
      dates,
      open,
      reminder,
      programmes: [programme.pid]
    })
  }

  get firstDate() {
    return this.dates[0]
  }

  get lastDate() {
    return this.dates.at(-1)
  }

  get dates_() {
    return this.dates.map((date) => convertIsoDateToObject(date))
  }

  set dates_(object) {
    if (object) {
      this.dates = Object.values(object).map((obj) =>
        convertObjectToIsoDate(obj)
      )
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

  get close() {
    // Always close consent for school sessions one day before final session
    if (this.lastDate) {
      return removeDays(this.lastDate, 1)
    }
  }

  get consentWindow() {
    return getConsentWindow(this)
  }

  get status() {
    const today = getToday()

    switch (true) {
      case isBetweenDates(today, this.firstDate, this.lastDate):
        return SessionStatus.Active
      case isBefore(today, this.firstDate):
        return SessionStatus.Planned
      case isAfter(today, this.lastDate):
        return SessionStatus.Completed
      default:
        return SessionStatus.Unplanned
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
      return `Session at ${this.location.name}`
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
      location: `<span>${formatLink(this.uri, this.location.name)}</br>
        <span class="nhsuk-u-secondary-text-color">
          ${this.location.addressLine1},
          ${this.location.addressLevel1},
          ${this.location.postalCode}
        </span>
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

    let formattedDates =
      this.dates.length > 0
        ? this.dates.map((date) => formatDate(date, { dateStyle: 'full' }))
        : ''

    const formattedProgrammes = this.programmes.map((programme) => {
      const { name } = Object.values(programmeTypes).find(
        (type) => type.pid === programme
      )
      return name
    })

    return {
      dates: formatList(formattedDates).replace(
        'nhsuk-list--bullet',
        'app-list--sessions'
      ),
      firstDate: formatDate(this.firstDate, {
        dateStyle: 'full'
      }),
      open: formatDate(this.open, {
        dateStyle: 'full'
      }),
      reminder: formatDate(this.reminder, {
        dateStyle: 'full'
      }),
      close: formatDate(this.close, {
        dateStyle: 'full'
      }),
      programmes: prototypeFilters.formatList(formattedProgrammes),
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
