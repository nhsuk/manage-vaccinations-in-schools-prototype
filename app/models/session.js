import { fakerEN_GB as faker } from '@faker-js/faker'
import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import { isAfter } from 'date-fns'
import _ from 'lodash'

import { getHealthQuestionKeys } from '../utils/consent.js'
import {
  removeDays,
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  includesDate,
  setMidday,
  today
} from '../utils/date.js'
import { getConsentWindow } from '../utils/session.js'
import {
  formatLink,
  formatLinkWithSecondaryText,
  formatList,
  formatTag,
  formatWithSecondaryText,
  lowerCaseFirst
} from '../utils/string.js'

import { Batch } from './batch.js'
import { Clinic } from './clinic.js'
import { Consent } from './consent.js'
import { OrganisationDefaults } from './organisation.js'
import {
  ConsentOutcome,
  PatientOutcome,
  PatientSession
} from './patient-session.js'
import { Programme } from './programme.js'
import { School } from './school.js'
import { Vaccine } from './vaccine.js'

/**
 * @readonly
 * @enum {string}
 */
export const ConsentWindow = {
  Opening: 'Opening',
  Open: 'Open',
  Closed: 'Closed',
  None: 'Session not scheduled'
}

/**
 * @readonly
 * @enum {string}
 */
export const SessionStatus = {
  Unplanned: 'No sessions scheduled',
  Planned: 'Sessions scheduled',
  Completed: 'All sessions completed',
  Closed: 'Closed'
}

/**
 * @readonly
 * @enum {string}
 */
export const SessionType = {
  School: 'School session',
  Clinic: 'Community clinic'
}

/**
 * @class Session
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} id - ID
 * @property {Date} [createdAt] - Created date
 * @property {string} [createdBy_uid] - User who created session
 * @property {string} [clinic_id] - Clinic ID
 * @property {string} [school_urn] - School URN
 * @property {Array<Date>} [dates] - Dates
 * @property {Array<object>} [dates_] - Dates (from `dateInput`s)
 * @property {Date} [openAt] - Date consent window opens
 * @property {object} [openAt_] - Date consent window opens (from `dateInput`)
 * @property {boolean} [closed] - Session closed
 * @property {number} [reminderWeeks] - Weeks before session to send reminders
 * @property {object} [defaultBatch_ids] - Vaccine GTIN: Default batch ID
 * @property {Array<string>} [programme_pids] - Programme PIDs
 */
export class Session {
  constructor(options, context) {
    this.context = context
    this.id = options?.id || faker.helpers.replaceSymbols('###')
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdBy_uid = options?.createdBy_uid
    this.clinic_id = options?.clinic_id
    this.school_urn = options?.school_urn
    this.dates = options?.dates
      ? options.dates.map((date) => new Date(date))
      : []
    this.dates_ = options?.dates_
    this.openAt = options?.openAt
      ? new Date(options.openAt)
      : this.firstDate
        ? removeDays(this.firstDate, OrganisationDefaults.SessionOpenWeeks * 7)
        : undefined
    this.openAt_ = options?.openAt_
    this.closed = options?.closed || false
    this.reminderWeeks =
      options?.reminderWeeks || OrganisationDefaults.SessionReminderWeeks
    this.defaultBatch_ids = options?.defaultBatch_ids || {}
    this.programme_pids = options?.programme_pids
      ? options.programme_pids.filter((pid) => pid !== '_unchecked')
      : []
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
  get openAt_() {
    return convertIsoDateToObject(this.openAt)
  }

  /**
   * Set date consent window opens from `dateInput`
   *
   * @param {object} object - dateInput object
   */
  set openAt_(object) {
    if (object) {
      this.openAt = convertObjectToIsoDate(object)
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
  get closeAt() {
    // Always close consent for school sessions one day before final session
    if (this.lastDate) {
      return removeDays(this.lastDate, 1)
    }
  }

  /**
   * Get consents (unmatched consent responses)
   *
   * @returns {Array<import('./consent.js').Consent>} - Consent
   */
  get consents() {
    return Consent.readAll(this.context).filter(
      ({ session_id }) => session_id === this.id
    )
  }

  /**
   * Get consent form URL
   *
   * @returns {string} - Consent form URL
   */
  get consentUrl() {
    return `/give-or-refuse-consent/${this.id}`
  }

  /**
   * Get consent form PDF
   *
   * @returns {string} - Consent form PDF
   */
  get consentPdf() {
    const pids = this.programme_pids.join('-')

    return `/public/downloads/${pids}-consent-form.pdf`
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
   * Is unplanned session
   *
   * @returns {boolean} - Is unplanned session
   */
  get isUnplanned() {
    return this.status === SessionStatus.Unplanned
  }

  /**
   * Is active session
   *
   * @returns {boolean} - Is active session
   */
  get isActive() {
    return includesDate(this.dates, setMidday(today()))
  }

  /**
   * Is completed session
   *
   * @returns {boolean} - Is completed session
   */
  get isCompleted() {
    return this.status === SessionStatus.Completed
  }

  /**
   * Is closed session
   *
   * @returns {boolean} - Is closed session
   */
  get isClosed() {
    return this.status === SessionStatus.Closed
  }

  /**
   * Get status
   *
   * @returns {string} - Status
   */
  get status() {
    switch (true) {
      case this.closed:
        return SessionStatus.Closed
      case this.dates.length === 0:
        return SessionStatus.Unplanned
      case isAfter(setMidday(today()), this.lastDate):
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
        return new Clinic(clinic, this.context)
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
        return new School(school, this.context)
      }
    } catch (error) {
      console.error('Session.school', error.message)
    }
  }

  /**
   * Get patient sessions
   *
   * @returns {Array<PatientSession>} - Patient sessions
   */
  get patientSessions() {
    if (this.context?.patients && this.id) {
      return PatientSession.readAll(this.context)
        .filter(({ session }) => session.id === this.id)
        .filter(({ patient }) => !patient?.pendingChanges?.school_urn)
    }

    return []
  }

  /**
   * Get patients
   *
   * @returns {Array<PatientSession>} - Patients
   */
  get patients() {
    return _.uniqBy(this.patientSessions, 'patient.nhsn')
  }

  /**
   * Get session programmes
   *
   * @returns {Array<Programme>} - Programmes
   */
  get programmes() {
    if (this.context?.programmes && this.programme_pids) {
      return this.programme_pids
        .sort()
        .map(
          (pid) => new Programme(this.context?.programmes[pid], this.context)
        )
    }

    return []
  }

  /**
   * Get health questions from across all programme vaccines
   *
   * @returns {Array} - Programmes
   */
  get healthQuestionKeys() {
    return getHealthQuestionKeys(this.vaccines)
  }

  /**
   * Get pre-screen questions from across all programme vaccines
   *
   * @returns {Array} - Programmes
   */
  get preScreenQuestionKeys() {
    const preScreenQuestionKeys = new Set()
    for (const vaccine of this.vaccines) {
      for (const key of vaccine.preScreenQuestionKeys) {
        preScreenQuestionKeys.add(key)
      }
    }

    return [...preScreenQuestionKeys]
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
   * Get default batches
   *
   * @returns {Array<Batch>} - Default batches
   */
  get defaultBatch() {
    return Object.entries(this.defaultBatch_ids).map(([, id]) =>
      Batch.read(id, this.context)
    )
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
      return `${this.immunisation} session at ${this.location.name}`
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

  /**
   * Get closing summary
   *
   * @returns {object} - Closing summary
   */
  get closingSummary() {
    return {
      noConsentRequest: this.patients.filter(
        ({ consent }) => consent === ConsentOutcome.NoRequest
      ),
      noConsentResponse: this.patients.filter(
        ({ consent }) => consent === ConsentOutcome.NoResponse
      ),
      couldNotVaccinate: this.patients.filter(
        ({ consent, outcome }) =>
          consent === ConsentOutcome.Given &&
          outcome !== PatientOutcome.Vaccinated
      )
    }
  }

  /**
   * Get patient sessions that can be moved to a clinic session
   *
   * @returns {Array<PatientSession>} - Patient sessions
   */
  get patientSessionsForClinic() {
    return this.patients
      .filter(({ consent }) =>
        [
          ConsentOutcome.NoResponse,
          ConsentOutcome.NoRequest,
          ConsentOutcome.Given
        ].includes(consent)
      )
      .filter(({ outcome }) =>
        [
          PatientOutcome.CouldNotVaccinate,
          PatientOutcome.NoOutcomeYet
        ].includes(outcome)
      )
  }

  get details() {
    return `<div>
      <p>${this.link.nameAndAddress}</p>
      <p>${this.dateSummary}</p>
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
    switch (this.consentWindow) {
      case ConsentWindow.Opening:
        consentWindow = `Consent period opens ${formatDate(this.openAt, consentDateStyle)}`
        break
      case ConsentWindow.Closed:
        consentWindow = `Consent period closed ${formatDate(this.closeAt, consentDateStyle)}`
        break
      case ConsentWindow.Open:
        consentWindow = `Consent period open from ${formatDate(this.openAt, consentDateStyle)} until ${formatDate(this.closeAt, consentDateStyle)}`
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
      openAt: formatDate(this.openAt, { dateStyle: 'full' }),
      reminderWeeks: formattedNextReminderDate
        ? formatWithSecondaryText(
            `Send ${reminderWeeks} before each session`,
            `First: ${formattedNextReminderDate}`
          )
        : `Send ${reminderWeeks} before each session`,
      closeAt: formatDate(this.closeAt, { dateStyle: 'full' }),
      patients: `${prototypeFilters.plural(this.patients.length, 'child')} in this session`,
      programmes: this.programmes
        .flatMap(({ name }) => formatTag({ colour: 'white', text: name }))
        .join(' '),
      consentUrl:
        this.consentUrl &&
        formatLink(
          this.consentUrl,
          'View parental consent form (opens in a new tab)',
          {
            target: '_blank'
          }
        ),
      consentPdf:
        this.consentPdf &&
        formatLink(this.consentPdf, 'Download parental consent form (PDF)', {
          download: 'true'
        }),
      consentWindow,
      location: Object.values(this.location)
        .filter((string) => string)
        .join(', '),
      school_urn: this.school && this.school.formatted.urn,
      status: formatTag(this.sessionStatus)
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
   * Get status properties
   *
   * @returns {object} - Status properties
   */
  get sessionStatus() {
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

    return {
      colour,
      text: this.isActive ? 'Session in progress' : this.status
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

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Session>|undefined} Sessions
   * @static
   */
  static readAll(context) {
    return Object.values(context.sessions).map(
      (session) => new Session(session, context)
    )
  }

  /**
   * Read
   *
   * @param {string} id - Session ID
   * @param {object} context - Context
   * @returns {Session|undefined} Session
   * @static
   */
  static read(id, context) {
    if (context?.sessions) {
      return new Session(context.sessions[id], context)
    }
  }

  /**
   * Create
   *
   * @param {Session} session - Session
   * @param {object} context - Context
   */
  create(session, context) {
    session = new Session(session)

    // Update context
    context.sessions = context.sessions || {}
    context.sessions[session.id] = session
  }

  /**
   * Create file
   *
   * @param {object} context - Context
   * @returns {object} - File buffer, name and mime type
   * @todo Create download using Mavis offline XLSX schema
   */
  createFile(context) {
    const { name } = new Session(this, context)

    return {
      buffer: Buffer.from(''),
      fileName: `${name}.csv`,
      mimetype: 'text/csv'
    }
  }

  /**
   * Update
   *
   * @param {object} updates - Updates
   * @param {object} context - Context
   */
  update(updates, context) {
    this.updatedAt = new Date()

    // Remove session context
    delete this.context

    // Delete original session (with previous ID)
    delete context.sessions[this.id]

    // Update context
    const updatedSession = _.merge(this, updates)

    context.sessions[updatedSession.id] = updatedSession
  }

  /**
   * Delete
   *
   * @param {object} context - Context
   */
  delete(context) {
    delete context.sessions[this.id]
  }
}
