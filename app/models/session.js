import { fakerEN_GB as faker } from '@faker-js/faker'
import { isAfter } from 'date-fns'
import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import clinics from '../datasets/clinics.js'
import schools from '../datasets/schools.js'
import {
  addDays,
  removeDays,
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  getToday,
  includesDate,
  setMidday
} from '../utils/date.js'
import {
  formatLink,
  formatList,
  formatMonospace,
  lowerCaseFirst
} from '../utils/string.js'
import { getConsentWindow } from '../utils/session.js'
import { OrganisationDefaults } from './organisation.js'
import { ProgrammeStatus, programmeTypes } from './programme.js'

export class ConsentWindow {
  static Opening = 'Opening'
  static Open = 'Open'
  static Closed = 'Closed'
  static None = 'Session not scheduled'
}

export class SessionStatus {
  static Unplanned = 'No sessions scheduled'
  static Planned = 'Sessions scheduled'
  static Completed = 'All sessions completed'
}

export class SessionType {
  static School = 'School session'
  static Clinic = 'Community clinic'
}

/**
 * @class Session
 * @property {string} id - ID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created session
 * @property {string} [clinic_id] - Clinic ID
 * @property {string} [school_urn] - School URN
 * @property {Array<string>} [dates] - Dates
 * @property {Array<object>} [dates_] - Dates (from `dateInput`s)
 * @property {string} [open] - Date consent window opens
 * @property {object} [open_] - Date consent window opens (from `dateInput`)
 * @property {number} [reminderWeeks] - Weeks before session to send reminders
 * @property {Array<string>} [programmes] - Programme PIDs
 */
export class Session {
  constructor(options) {
    this.id = options?.id || faker.helpers.replaceSymbols('###')
    this.created = options?.created || getToday().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.clinic_id = options?.clinic_id
    this.school_urn = options?.school_urn
    this.dates = options?.dates || []
    this.open = options?.open
      ? options.open
      : this.firstDate
        ? removeDays(this.firstDate, OrganisationDefaults.SessionOpenWeeks * 7)
        : undefined
    this.reminderWeeks =
      options?.reminderWeeks || OrganisationDefaults.SessionReminderWeeks
    this.programmes = options?.programmes || []
    // dateInput objects
    this.dates_ = options?.dates_
    this.open_ = options?.open_
    this.reminder_ = options?.reminder_
  }

  /**
   * Generate fake session
   * @param {string} urn - School URN
   * @param {import('./programme.js').Programme} programme - Programme
   * @param {import('./user.js').User} user - User
   * @param {object} [options] - Options
   * @returns {Session} - Session
   * @static
   */
  static generate(urn, programme, user, options = {}) {
    let status
    if (programme.status === ProgrammeStatus.Completed) {
      status = SessionStatus.Completed
    } else if (programme.status === ProgrammeStatus.Planned) {
      status = SessionStatus.Planned
    } else {
      status = faker.helpers.arrayElement([
        SessionStatus.Completed,
        SessionStatus.Planned,
        SessionStatus.Unplanned
      ])
    }

    let dates = []
    let firstSessionDate
    switch (status) {
      case SessionStatus.Planned:
        // Session will take place according programme schedule
        let { to } = programmeTypes[programme.type].schedule
        // Sessions start after first content window closes
        firstSessionDate = faker.date.between({ from: getToday(), to })
        break
      case SessionStatus.Unplanned:
        firstSessionDate = undefined
        break
      default:
        // Session took place about 7 days before today
        firstSessionDate = faker.date.recent({ days: 28, refDate: getToday() })
    }

    // Set first session as taking place today
    if (options.isToday) {
      firstSessionDate = getToday()
    }

    if (firstSessionDate) {
      firstSessionDate = setMidday(firstSessionDate)

      // Don’t create sessions during weekends
      if ([0, 6].includes(firstSessionDate.getDay())) {
        firstSessionDate = removeDays(firstSessionDate, 2)
      }

      dates.push(firstSessionDate)

      // Add additional session dates
      for (const _index of [1, 2]) {
        if (_index === 0) continue
        const previousDate = dates[_index - 1]
        const subsequentDate = setMidday(addDays(previousDate, 7))
        dates.push(subsequentDate)
      }
    }

    const created = new Date(removeDays(getToday(), 70))

    return new Session({
      created,
      created_user_uid: user.uid,
      school_urn: urn,
      dates,
      programmes: [programme.pid]
    })
  }

  /**
   * Get session dates for `dateInput`s
   * @returns {Array<object|undefined>} - `dateInput` objects
   */
  get dates_() {
    return this.dates.map((date) => convertIsoDateToObject(date))
  }

  /**
   * Set session dates from `dateInput`s
   * @param {object} object - dateInput object
   */
  set dates_(object) {
    if (object) {
      this.dates = Object.values(object).map((date) =>
        convertObjectToIsoDate(date)
      )
    }
  }

  /**
   * Get date consent window opens for `dateInput`
   * @returns {object|undefined} - `dateInput` object
   */
  get open_() {
    return convertIsoDateToObject(this.open)
  }

  /**
   * Set date consent window opens from `dateInput`
   * @param {object} object - dateInput object
   */
  set open_(object) {
    if (object) {
      this.open = convertObjectToIsoDate(object)
    }
  }

  /**
   * Get first session date
   * @returns {string} - First session date
   */
  get firstDate() {
    return this.dates[0]
  }

  /**
   * Get last session date
   * @returns {string} - Last session date
   */
  get lastDate() {
    return this.dates.at(-1)
  }

  /**
   * Get remaining session dates
   * @returns {Array<string>} - Remaining session dates
   */
  get remainingDates() {
    let remainingDates = [...this.dates]
    remainingDates.shift()

    return remainingDates
  }

  /**
   * Get date next automated reminder will be sent
   * @returns {Date|undefined} - Next reminder date
   */
  get nextReminderDate() {
    if (this.dates.length > 0) {
      return removeDays(this.dates[0], this.reminderWeeks * 7)
    }
  }

  /**
   * Get consent close date
   * @returns {Date|undefined} - Consent close date
   */
  get close() {
    // Always close consent for school sessions one day before final session
    if (this.lastDate) {
      return removeDays(this.lastDate, 1)
    }
  }

  /**
   * Get consent URL
   * @returns {object} - Consent window
   */
  get consentUrl() {
    if (this.firstDate && this.consentWindow.value !== ConsentWindow.Closed) {
      return `/consents/${this.id}`
    }
  }

  /**
   * Get consent window
   * @returns {object} - Consent window
   */
  get consentWindow() {
    return getConsentWindow(this)
  }

  /**
   * Is active session
   * @returns {boolean} - Is active session
   */
  get isActive() {
    const today = setMidday(getToday())
    return includesDate(this.dates, today)
  }

  /**
   * Get status
   * @returns {string} - Status
   */
  get status() {
    const today = setMidday(getToday())
    switch (true) {
      case this.dates.length === 0:
        return SessionStatus.Unplanned
      case isAfter(today, this.lastDate):
        return SessionStatus.Completed
      default:
        return SessionStatus.Planned
    }
  }

  /**
   * Get clinic
   * @returns {object} - School
   */
  get clinic() {
    return clinics[this.clinic_id]
  }

  /**
   * Get school
   * @returns {object} - School
   */
  get school() {
    return schools[this.school_urn]
  }

  /**
   * Get type
   * @returns {string} - Status
   */
  get type() {
    return this.school_urn ? SessionType.School : SessionType.Clinic
  }

  /**
   * Get location
   * @returns {object} - Location
   */
  get location() {
    const type = this.type === SessionType.School ? 'school' : 'clinic'

    return {
      name: this[type].name,
      addressLine1: this[type].addressLine1,
      addressLine2: this[type].addressLine2,
      addressLevel1: this[type].addressLevel1,
      postalCode: this[type].postalCode
    }
  }

  /**
   * Get name
   * @returns {string|undefined} - Name
   */
  get name() {
    if (this.location) {
      return `${this.type} at ${this.location.name}`
    }
  }

  get dateSummary() {
    if (this.status === SessionStatus.Planned) {
      const firstDate = formatDate(this.firstDate, {
        day: 'numeric',
        month: 'long'
      })
      const consentWindow = lowerCaseFirst(this.formatted.consentWindow)
      return `First session starts ${firstDate}<br>Consent period ${consentWindow}`
    } else if (this.status === SessionStatus.Completed) {
      const lastDate = formatDate(this.lastDate, {
        day: 'numeric',
        month: 'long'
      })
      return `Last session completed ${lastDate}`
    } else {
      return 'No sessions scheduled'
    }
  }

  get details() {
    return `<div><p>${this.link.location}</p></p>${this.dateSummary}</p></div>`
  }

  /**
   * Get formatted values
   * @returns {object} - Formatted values
   */
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
      case ConsentWindow.Open:
        consentWindow = `Open until ${formatDate(this.close, consentDateStyle)}`
        break
      default:
        consentWindow = ''
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

    const formattedNextReminderDate = formatDate(this.nextReminderDate, {
      dateStyle: 'full'
    })

    const reminderWeeks = prototypeFilters.plural(this.reminderWeeks, 'week')

    return {
      dates: formatList(formattedDates).replace(
        'nhsuk-list--bullet',
        'app-list--sessions'
      ),
      firstDate: formatDate(this.firstDate, { dateStyle: 'full' }),
      open: formatDate(this.open, { dateStyle: 'full' }),
      reminderWeeks: `Send ${reminderWeeks} before each session</br>
      <span class="nhsuk-u-secondary-text-color">First: ${formattedNextReminderDate}</span>`,
      close: formatDate(this.close, { dateStyle: 'full' }),
      programmes: prototypeFilters.formatList(formattedProgrammes),
      consentUrl:
        this.consentUrl &&
        formatLink(
          this.consentUrl,
          'View parental consent form (opens in a new tab)',
          {
            target: '_blank'
          }
        ),
      consentWindow,
      school_urn: formatMonospace(this.school_urn)
    }
  }

  /**
   * Get formatted links
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      location: this.location?.postalCode
        ? `<span>${formatLink(this.uri, this.location.name)}</br>
        <span class="nhsuk-u-secondary-text-color">
          ${this.location.addressLine1},
          ${this.location.addressLevel1},
          ${this.location.postalCode}
        </span>
      </span>`
        : formatLink(this.uri, this.location.name)
    }
  }

  /**
   * Get formatted summary
   * @returns {object} - Formatted summaries
   */
  get summary() {
    let dates =
      this.dates.length > 0
        ? this.dates.map((date) =>
            formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })
          )
        : ''

    let firstDate =
      this.dates.length > 0
        ? formatDate(this.firstDate, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })
        : ''

    let remainingDates =
      this.remainingDates && this.remainingDates.length > 0
        ? this.remainingDates.map((date) =>
            formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })
          )
        : []

    return {
      dates: prototypeFilters.formatList(dates),
      datesDisjunction: prototypeFilters.formatList(dates, 'disjunction'),
      firstDate,
      remainingDates: prototypeFilters.formatList(remainingDates),
      location: `${this.location.name}</br>
      <span class="nhsuk-u-secondary-text-color">
        ${this.location.addressLine1},
        ${this.location.addressLevel1},
        ${this.location.postalCode}
      </span>`
    }
  }

  /**
   * Get status for `tag`
   * @returns {object} - `tag` object
   */
  get statusTag() {
    let colour
    switch (this.status) {
      case SessionStatus.Completed:
        colour = 'green'
        break
      case SessionStatus.Unplanned:
        colour = 'purple'
        break
      default:
        colour = 'blue'
    }

    return this.isActive
      ? {
          text: 'Session in progress'
        }
      : {
          classes: `nhsuk-tag--${colour}`,
          text: this.status
        }
  }

  /**
   * Get namespace
   * @returns {string} - Namespace
   */
  get ns() {
    return 'session'
  }

  /**
   * Get URI
   * @returns {string} - URI
   */
  get uri() {
    return `/sessions/${this.id}`
  }
}
