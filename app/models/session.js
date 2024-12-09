import { fakerEN_GB as faker } from '@faker-js/faker'
import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import { isAfter } from 'date-fns'

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
import { getConsentWindow } from '../utils/session.js'
import {
  formatLink,
  formatLinkWithSecondaryText,
  formatList,
  formatMonospace,
  lowerCaseFirst
} from '../utils/string.js'

import { Clinic } from './clinic.js'
import { OrganisationDefaults } from './organisation.js'
import { Patient } from './patient.js'
import { Programme } from './programme.js'
import { School } from './school.js'
import { Vaccine } from './vaccine.js'

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
  static Closed = 'Closed'
}

export class SessionType {
  static School = 'School session'
  static Clinic = 'Community clinic'
}

/**
 * @class Session
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} id - ID
 * @property {Date} created - Created date
 * @property {string} [created_user_uid] - User who created session
 * @property {string} [clinic_id] - Clinic ID
 * @property {string} [school_urn] - School URN
 * @property {Array<Date>} [dates] - Dates
 * @property {Array<object>} [dates_] - Dates (from `dateInput`s)
 * @property {Date} [open] - Date consent window opens
 * @property {object} [open_] - Date consent window opens (from `dateInput`)
 * @property {boolean} [closed] - Session closed
 * @property {number} [reminderWeeks] - Weeks before session to send reminders
 * @property {Array<string>} [programme_pids] - Programme PIDs
 */
export class Session {
  constructor(options, context) {
    this.context = context
    this.id = options?.id || faker.helpers.replaceSymbols('###')
    this.created = options?.created ? new Date(options.created) : getToday()
    this.created_user_uid = options?.created_user_uid
    this.clinic_id = options?.clinic_id
    this.school_urn = options?.school_urn
    this.dates = options?.dates
      ? options.dates.map((date) => new Date(date))
      : []
    this.open = options?.open
      ? new Date(options.open)
      : this.firstDate
        ? removeDays(this.firstDate, OrganisationDefaults.SessionOpenWeeks * 7)
        : undefined
    this.closed = options?.closed || false
    this.reminderWeeks =
      options?.reminderWeeks || OrganisationDefaults.SessionReminderWeeks
    this.programme_pids = options?.programme_pids || []
    // dateInput objects
    this.dates_ = options?.dates_
    this.open_ = options?.open_
    this.reminder_ = options?.reminder_
  }

  /**
   * Generate fake session
   *
   * @param {object} term - Term dates
   * @param {import('./user.js').User} user - User
   * @param {Array<string>} programme_pids - Programme PIDs
   * @param {object} options - Options
   * @param {string} [options.clinic_id] - Clinic ID
   * @param {string} [options.school_urn] - School URN
   * @returns {Session} - Session
   * @static
   */
  static generate(programme_pids, term, user, options) {
    const { clinic_id, school_urn } = options

    let status
    if (isAfter(getToday(), term.to)) {
      status = SessionStatus.Completed
    } else {
      status = faker.helpers.arrayElement([
        SessionStatus.Completed,
        SessionStatus.Planned,
        SessionStatus.Unplanned
      ])
    }

    const dates = []
    let firstSessionDate
    const tomorrow = addDays(getToday(), 1)
    switch (status) {
      case SessionStatus.Planned:
        // Earliest date is tomorrow
        // Latest date is the last day of term
        firstSessionDate = faker.date.between({
          from: tomorrow,
          to: term.to
        })
        break
      case SessionStatus.Completed:
        // Earliest date is first day of term
        // Latest date is the last day of term
        firstSessionDate = faker.date.between({
          from: term.from,
          to: term.to
        })
        break
      case SessionStatus.Unplanned:
      default:
        firstSessionDate = undefined
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
        if (_index !== 0) {
          const previousDate = dates[_index - 1]
          const subsequentDate = setMidday(addDays(previousDate, 7))
          dates.push(subsequentDate)
        }
      }
    }

    return new Session({
      created: removeDays(getToday(), 70),
      created_user_uid: user.uid,
      dates,
      programme_pids,
      ...(clinic_id && { clinic_id }),
      ...(school_urn && { school_urn })
    })
  }

  /**
   * Get session dates for `dateInput`s
   *
   * @returns {Array<object|undefined>} - `dateInput` objects
   */
  get dates_() {
    return this.dates.map((date) => convertIsoDateToObject(date))
  }

  /**
   * Set session dates from `dateInput`s
   *
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
   *
   * @returns {object|undefined} - `dateInput` object
   */
  get open_() {
    return convertIsoDateToObject(this.open)
  }

  /**
   * Set date consent window opens from `dateInput`
   *
   * @param {object} object - dateInput object
   */
  set open_(object) {
    if (object) {
      this.open = convertObjectToIsoDate(object)
    }
  }

  /**
   * Get first session date
   *
   * @returns {Date} - First session date
   */
  get firstDate() {
    return this.dates[0]
  }

  /**
   * Get last session date
   *
   * @returns {Date} - Last session date
   */
  get lastDate() {
    return this.dates.at(-1)
  }

  /**
   * Get remaining session dates
   *
   * @returns {Array<Date>} - Remaining session dates
   */
  get remainingDates() {
    const remainingDates = [...this.dates]
    remainingDates.shift()

    return remainingDates
  }

  /**
   * Get next session date
   *
   * @returns {Date} - Next session dates
   */
  get nextDate() {
    return this.remainingDates[0]
  }

  /**
   * Get date next automated reminder will be sent
   *
   * @returns {Date|undefined} - Next reminder date
   */
  get nextReminderDate() {
    if (this.dates.length > 0) {
      return removeDays(this.dates[0], this.reminderWeeks * 7)
    }
  }

  /**
   * Get consent close date
   *
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
   *
   * @returns {object|undefined} - Consent window
   */
  get consentUrl() {
    if (this.firstDate && this.consentWindow.value !== ConsentWindow.Closed) {
      return `/consents/${this.id}`
    }
  }

  /**
   * Get consent window
   *
   * @returns {object} - Consent window
   */
  get consentWindow() {
    return getConsentWindow(this)
  }

  /**
   * Is active session
   *
   * @returns {boolean} - Is active session
   */
  get isActive() {
    const today = setMidday(getToday())
    return includesDate(this.dates, today)
  }

  /**
   * Get status
   *
   * @returns {string} - Status
   */
  get status() {
    const today = setMidday(getToday())
    switch (true) {
      case this.closed:
        return SessionStatus.Closed
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
   *
   * @returns {Clinic} - Clinic
   */
  get clinic() {
    try {
      const clinic = this.context?.clinics[this.clinic_id]
      if (clinic) {
        return new Clinic(clinic)
      }
    } catch (error) {
      console.error('Session.clinic', error.message)
    }
  }

  /**
   * Get school
   *
   * @returns {School} - School
   */
  get school() {
    try {
      const school = this.context?.schools[this.school_urn]
      if (school) {
        return new School(school)
      }
    } catch (error) {
      console.error('Session.school', error.message)
    }
  }

  /**
   * Get session patients
   *
   * @returns {Array<Patient>} - Patients
   */
  get patients() {
    if (this.context?.patients && this.id) {
      return Object.values(this.context.patients)
        .map((patient) => new Patient(patient))
        .filter(({ session_ids }) => session_ids.includes(this.id))
        .filter(({ record }) => !record?.pendingChanges?.urn)
    }

    return []
  }

  /**
   * Get session programmes
   *
   * @returns {Array<Programme>} - Programmes
   */
  get programmes() {
    if (this.context?.programmes && this.programme_pids) {
      return this.programme_pids.map(
        (pid) => new Programme(this.context?.programmes[pid])
      )
    }

    return []
  }

  /**
   * Get session vaccines
   *
   * @returns {Array<Vaccine>} - Vaccines
   */
  get vaccines() {
    if (this.context?.vaccines && this.programmes) {
      const gtins = new Set()

      for (const programme of this.programmes) {
        for (const vaccine_gtin of programme.vaccines) {
          gtins.add(vaccine_gtin)
        }
      }

      return [...gtins].map((gtin) => new Vaccine(this.context?.vaccines[gtin]))
    }

    return []
  }

  /**
   * Get vaccination name (sentence case)
   *
   * @returns {string} - Vaccination name
   * @example flu vaccination
   * @example flu and HPV vaccinations
   */
  get vaccination() {
    const pluralisation =
      this.programmes.length === 1 ? 'vaccination' : 'vaccinations'

    return `${this.immunisation} ${pluralisation}`
  }

  /**
   * Get vaccination title (Title case)
   *
   * @returns {string} - Vaccination title
   * @example Flu vaccination
   * @example Flu and HPV vaccinations
   */
  get vaccinationTitle() {
    const pluralisation =
      this.programmes.length === 1 ? 'vaccination' : 'vaccinations'

    return `${this.immunisation.replace('flu', 'Flu')} ${pluralisation}`
  }

  /**
   * Get programme immunisation
   *
   * @returns {string} - Programme immunisation
   * @example flu
   * @example flu and HPV
   */
  get immunisation() {
    return prototypeFilters.formatList(
      this.programmes.map(({ name }) => name.replace('Flu', 'flu'))
    )
  }

  /**
   * Get programme title
   *
   * @returns {string} - Programme title
   */
  get programmeTitle() {
    return prototypeFilters.formatList(
      this.programmes.map(({ information }) => information.title)
    )
  }

  /**
   * Get type
   *
   * @returns {string} - Status
   */
  get type() {
    return this.school_urn ? SessionType.School : SessionType.Clinic
  }

  /**
   * Get location
   *
   * @returns {object} - Location
   */
  get location() {
    const type = this.type === SessionType.School ? 'school' : 'clinic'

    if (this[type]) {
      return this[type].location
    }

    return 'Unknown location'
  }

  /**
   * Get address
   *
   * @returns {import('./address.js').Address} Address
   */
  get address() {
    const type = this.type === SessionType.School ? 'school' : 'clinic'

    if (this[type]) {
      return this[type].address
    }
  }

  /**
   * Get name
   *
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
    }
    return 'No sessions scheduled'
  }

  get details() {
    return `<div>
      <p>${this.link.nameAndAddress}</p>
      </p>${this.dateSummary}</p>
    </div>`
  }

  /**
   * Get formatted values
   *
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

    const formattedDates =
      this.dates.length > 0
        ? this.dates.map((date) => formatDate(date, { dateStyle: 'full' }))
        : ''

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
      nextDate: formatDate(this.nextDate, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }),
      open: formatDate(this.open, { dateStyle: 'full' }),
      reminderWeeks: `Send ${reminderWeeks} before each session</br>
      <span class="nhsuk-u-secondary-text-color">First: ${formattedNextReminderDate}</span>`,
      close: formatDate(this.close, { dateStyle: 'full' }),
      programmes: this.programmes.map(({ name }) => name).join('<br>'),
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
      school_urn: formatMonospace(this.school_urn),
      location: Object.values(this.location)
        .filter((string) => string)
        .join(', ')
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      nameAndAddress: formatLinkWithSecondaryText(
        this.uri,
        this.location.name,
        this.address?.formatted.singleline
      )
    }
  }

  /**
   * Get formatted summary
   *
   * @returns {object} - Formatted summaries
   */
  get summary() {
    const dates =
      this.dates.length > 0
        ? this.dates.map((date) =>
            formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })
          )
        : ''

    const firstDate =
      this.dates.length > 0
        ? formatDate(this.firstDate, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })
        : ''

    const remainingDates =
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
   *
   * @returns {object} - `tag` object
   */
  get statusTag() {
    let colour
    switch (this.status) {
      case SessionStatus.Closed:
        colour = 'red'
        break
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
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'session'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/sessions/${this.id}`
  }
}
