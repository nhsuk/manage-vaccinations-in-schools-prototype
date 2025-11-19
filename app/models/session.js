import { fakerEN_GB as faker } from '@faker-js/faker'
import { default as filters } from '@x-govuk/govuk-prototype-filters'
import { isAfter, isSameDay } from 'date-fns'
import _ from 'lodash'

import programmesData from '../datasets/programmes.js'
import {
  ConsentOutcome,
  ConsentWindow,
  InstructionOutcome,
  OrganisationDefaults,
  PatientStatus,
  ProgrammePreset,
  ProgrammeType,
  SessionStatus,
  SessionType,
  VaccineCriteria
} from '../enums.js'
import {
  removeDays,
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  getCurrentAcademicYear,
  setMidday,
  today
} from '../utils/date.js'
import { tokenize } from '../utils/object.js'
import { getConsentWindow, getSessionActivityCount } from '../utils/session.js'
import {
  formatLink,
  formatList,
  formatWithSecondaryText,
  formatYearGroups,
  sentenceCaseProgrammeName,
  stringToBoolean
} from '../utils/string.js'

import { Clinic } from './clinic.js'
import { Consent } from './consent.js'
import { PatientSession } from './patient-session.js'
import { Programme } from './programme.js'
import { School } from './school.js'
import { Vaccine } from './vaccine.js'

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
 * @property {Date} [date] - Dates
 * @property {object} [date_] - Dates (from `dateInput`s)
 * @property {Date} [openAt] - Date consent window opens
 * @property {object} [openAt_] - Date consent window opens (from `dateInput`)
 * @property {boolean} [closed] - Session closed
 * @property {number} [reminderWeeks] - Weeks before session to send reminders
 * @property {boolean} [registration] - Does session have registration?
 * @property {object} [register] - Patient register
 * @property {string} [programmePreset] - Programme preset name
 * @property {number} [academicYear] - Programme year
 * @property {boolean} [nationalProtocol] - Enable national protocol
 * @property {boolean} [psdProtocol] - Enable PSD protocol
 */
export class Session {
  constructor(options, context) {
    this.context = context
    this.id = options?.id || faker.helpers.replaceSymbols('###')
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdBy_uid = options?.createdBy_uid
    this.type = options?.type || SessionType.School
    this.clinic_id = options?.clinic_id
    this.school_urn = options?.school_urn
    this.date = options?.date && new Date(options.date)
    this.date_ = options?.date_
    this.openAt = options?.openAt
      ? new Date(options.openAt)
      : this.date
        ? removeDays(this.date, OrganisationDefaults.SessionOpenWeeks * 7)
        : undefined
    this.openAt_ = options?.openAt_
    this.closed = options?.closed || false
    this.reminderWeeks =
      options?.reminderWeeks || OrganisationDefaults.SessionReminderWeeks
    this.registration = stringToBoolean(options?.registration)
    this.register = options?.register || {}
    this.academicYear = options?.academicYear || getCurrentAcademicYear()
    this.programmePreset = options?.programmePreset
    this.psdProtocol = stringToBoolean(options?.psdProtocol) || false

    if (this.programmePreset === 'SeasonalFlu') {
      this.nationalProtocol =
        stringToBoolean(options?.nationalProtocol) || false
    }
  }

  /**
   * Get session date for `dateInput`s
   *
   * @returns {Array<object|undefined>} `dateInput` objects
   */
  get date_() {
    return convertIsoDateToObject(this.date)
  }

  /**
   * Set session date from `dateInput`s
   *
   * @param {object} object - dateInput object
   */
  set date_(object) {
    if (object) {
      this.date = convertObjectToIsoDate(object)
    }
  }

  /**
   * Get date consent window opens for `dateInput`
   *
   * @returns {object|undefined} `dateInput` object
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
   * Get date reminders to give consent are sent
   *
   * @returns {Date|undefined} Reminder dates
   */
  get reminderDate() {
    if (this.date) {
      return removeDays(this.date, 7)
    }
  }

  /**
   * Get date next automated reminder will be sent
   *
   * @returns {Date|undefined} Next reminder date
   */
  get nextReminderDate() {
    if (this.date) {
      return removeDays(this.date, this.reminderWeeks * 7)
    }
  }

  /**
   * Get consent close date
   *
   * @returns {Date|undefined} Consent close date
   */
  get closeAt() {
    // Always close consent for school sessions one day before final session
    if (this.date) {
      return removeDays(this.date, 1)
    }
  }

  /**
   * Get consents (unmatched consent responses)
   *
   * @returns {Array<import('./consent.js').Consent>} Consent
   */
  get consents() {
    if (this.context.replies) {
      return Consent.findAll(this.context).filter(
        ({ session_id }) => session_id === this.id
      )
    }

    return []
  }

  /**
   * Get consent form URL
   *
   * @returns {string} Consent form URL
   */
  get consentUrl() {
    return `/give-or-refuse-consent/${this.id}`
  }

  /**
   * Get consent form HTML list
   *
   * @returns {string} Consent form HTML list
   */
  get consentForms() {
    if (!this.isCompleted) {
      let forms = [this.formatted.consentUrl]

      for (const programme of this.programmes) {
        forms = [...forms, programme.formatted.consentPdf]
      }

      return formatList(forms).replace(' nhsuk-list--bullet', '')
    }

    return ''
  }

  /**
   * Get consent window
   *
   * @returns {object} Consent window
   */
  get consentWindow() {
    return getConsentWindow(this)
  }

  /**
   * Is unplanned session
   *
   * @returns {boolean} Is unplanned session
   */
  get isUnplanned() {
    return this.status === SessionStatus.Unplanned
  }

  /**
   * Is planned session
   *
   * @returns {boolean} Is planned session
   */
  get isPlanned() {
    return this.status === SessionStatus.Planned
  }

  /**
   * Is active session
   *
   * @returns {boolean} Is active session
   */
  get isActive() {
    return this.status === SessionStatus.Active
  }

  /**
   * Is completed session
   *
   * @returns {boolean} Is completed session
   */
  get isCompleted() {
    return this.status === SessionStatus.Completed
  }

  /**
   * Is closed session
   *
   * @returns {boolean} Is closed session
   */
  get isClosed() {
    return this.status === SessionStatus.Closed
  }

  /**
   * Does session occur in the current academic year?
   *
   * @returns {boolean} Session occurs in current academic year
   */
  get isPastSession() {
    return this.academicYear < getCurrentAcademicYear()
  }

  /**
   * Get status
   *
   * @returns {string} Status
   */
  get status() {
    switch (true) {
      case isSameDay(this.date, setMidday(today())):
        return SessionStatus.Active
      case this.closed:
        return SessionStatus.Closed
      case !this.date:
        return SessionStatus.Unplanned
      case isAfter(setMidday(today()), this.date):
        return SessionStatus.Completed
      default:
        return SessionStatus.Planned
    }
  }

  /**
   * Get clinic
   *
   * @returns {Clinic|undefined}} Clinic
   */
  get clinic() {
    if (this.clinic_id) {
      try {
        return Clinic.findOne(this.clinic_id, this.context)
      } catch (error) {
        console.error('Session.clinic', error.message)
      }
    }
  }

  /**
   * Get school
   *
   * @returns {School|undefined} School
   */
  get school() {
    if (this.school_urn) {
      try {
        return School.findOne(this.school_urn, this.context)
      } catch (error) {
        console.error('Session.school', error.message)
      }
    }
  }

  /**
   * Get patient sessions
   *
   * @returns {Array<PatientSession>} Patient sessions
   */
  get patientSessions() {
    if (this.context?.patients && this.id) {
      return PatientSession.findAll(this.context)
        .filter(({ session }) => session.id === this.id)
        .filter(({ patient }) => !patient?.pendingChanges?.school_urn)
    }

    return []
  }

  /**
   * Get patients
   *
   * @returns {Array<PatientSession>} Patient sessions
   */
  get patients() {
    return _.uniqBy(this.patientSessions, 'patient.nhsn')
  }

  /**
   * Get primary programme ids
   *
   * @returns {Array<string>} Programme IDs
   */
  get programme_ids() {
    const programme_ids = new Set()

    if (this.programmePreset) {
      const preset = ProgrammePreset[this.programmePreset]
      for (const programmeType of preset.programmeTypes) {
        const programme = programmesData[programmeType]
        programme_ids.add(programme.id)
      }
    }

    return [...programme_ids]
  }

  /**
   * Get session programmes
   *
   * @returns {Array<Programme>} Programmes
   */
  get programmes() {
    return this.programme_ids
      .map((id) => Programme.findOne(id, this.context))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Get year groups in school session
   *
   * @returns {Array<number>|undefined} Year groups
   * @todo Make this an option on the constructor
   * @todo Select year groups when creating a new session
   */
  get yearGroups() {
    if (this.school) {
      const programmeYearGroups = this.programmes.flatMap(
        (programme) => programme.yearGroups
      )

      return this.school.yearGroups.filter((num) =>
        programmeYearGroups.includes(num)
      )
    }
  }

  /**
   * Get session vaccines
   *
   * @returns {Array<Vaccine>} Vaccines
   */
  get vaccines() {
    if (this.context?.vaccines && this.programmes) {
      const snomedCodes = new Set()

      for (const programme of this.programmes) {
        for (const vaccine_snomed of programme.vaccine_smomeds) {
          snomedCodes.add(vaccine_snomed)
        }
      }

      return [...snomedCodes].map(
        (snomed) => new Vaccine(this.context?.vaccines[snomed])
      )
    }

    return []
  }

  /**
   * Get all vaccine criteria used in session (if more than one)
   *
   * @returns {Array<VaccineCriteria>} Vaccine criteria
   */
  get vaccineCriteria() {
    const vaccineCriteria = new Set()

    for (const vaccine of this.vaccines) {
      vaccineCriteria.add(vaccine.criteria)
    }

    if (vaccineCriteria.size > 1) {
      return [...vaccineCriteria]
    }
  }

  /**
   * Check if session offers an alternative vaccine
   * For example, the flu programme offer both nasal and injection vaccines
   *
   * @returns {boolean} Has alternative vaccines
   */
  get offersAlternativeVaccine() {
    const programmesWithAlternativeVaccine = this.programmes.filter(
      ({ alternativeVaccine }) => alternativeVaccine
    )

    return programmesWithAlternativeVaccine.length > 0
  }

  /**
   * Check if session offers an intranasal vaccine
   * For example, the standard vaccine for the flu programme is a nasal spray
   *
   * @returns {boolean} Has alternative vaccines
   */
  get offersIntranasalVaccine() {
    const programmesWithIntranasalVaccine = this.programmes.filter(
      ({ standardVaccine }) =>
        standardVaccine.criteria === VaccineCriteria.Intranasal
    )

    return programmesWithIntranasalVaccine.length > 0
  }

  /**
   * Get programme name(s)
   *
   * @returns {object} Programme name(s)
   * @example Flu
   * @example Td/IPV and MenACWY
   */
  get programmeNames() {
    return {
      sentenceCase: filters.formatList(
        this.programmes.map(({ name }) => sentenceCaseProgrammeName(name))
      ),
      titleCase: filters.formatList(this.programmes.map(({ name }) => name))
    }
  }

  /**
   * Get primary vaccination name(s)
   *
   * @returns {object} Vaccination name(s)
   * @example Flu vaccination
   * @example Td/IPV and MenACWY vaccinations
   */
  get vaccinationNames() {
    const pluralisation =
      this.programmes.length === 1 ? 'vaccination' : 'vaccinations'

    return {
      sentenceCase: `${filters.formatList(
        this.programmes.map((programme) =>
          sentenceCaseProgrammeName(programme.emailName())
        )
      )} ${pluralisation}`,
      titleCase: `${filters.formatList(this.programmes.map((programme) => programme.emailName()))}
        ${pluralisation}`
    }
  }

  /**
   * Get vaccination name to use in subject for email invitation
   *
   * @returns {string} Vaccination name(s)
   * @example ‘MMR catch-up’ or ‘MMR (measles, mumps and rubella) catch-up’
   */
  get vaccinationInviteNames() {
    if (this.programmes[0].type === ProgrammeType.MMR) {
      return this.programmes[0].emailName('invite')
    }
    return this.vaccinationNames.titleCase
  }

  /**
   * Get location
   *
   * @returns {object} Location
   */
  get location() {
    const type = this.type === SessionType.School ? 'school' : 'clinic'

    return this[type]?.location
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
   * @returns {string|undefined} Name
   */
  get name() {
    if (this.clinic) {
      return `${this.programmeNames.titleCase} community clinic on ${this.formatted.dateShort}`
    }

    if (this.location) {
      return `${this.programmeNames.titleCase} session at ${this.location.name} on ${this.formatted.dateShort}`
    }
  }

  /**
   * Get session activity counts
   *
   * @returns {object} Session activity counts
   */
  get activity() {
    return {
      getConsent: getSessionActivityCount(this, [
        {
          consent: ConsentOutcome.NoResponse
        }
      ]),
      instruct: getSessionActivityCount(this, [
        {
          report: PatientStatus.Due,
          instruct: InstructionOutcome.Needed
        }
      ])
    }
  }

  /**
   * Get session tally programme count
   *
   * @param {string} programme_id - Programme ID
   * @param {PatientStatus} report - Programme status
   * @param {VaccineCriteria} vaccineCriteria - Vaccine criteria
   * @returns {number} Session tally count
   */
  tally(programme_id, report, vaccineCriteria) {
    return getSessionActivityCount(this, [
      { programme_id, report, vaccineCriteria }
    ])
  }

  /**
   * Get closing summary
   *
   * @returns {object} Closing summary
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
        ({ report }) => report !== PatientStatus.Vaccinated
      )
    }
  }

  /**
   * Get patient sessions that can be moved to a clinic session
   *
   * @returns {Array<PatientSession>} Patient sessions
   */
  get patientSessionsForClinic() {
    return this.patients.filter(({ report }) => report === PatientStatus.Due)
  }

  /**
   * Get tokenised values (to use in search queries)
   *
   * @returns {string} Tokens
   */
  get tokenized() {
    const tokens = tokenize(this, ['location.postalCode', 'location.name'])

    return [tokens].join(' ')
  }

  /**
   * Get formatted values
   *
   * @returns {object} Formatted values
   */
  get formatted() {
    let consentWindow
    const consentDateStyle = { day: 'numeric', month: 'long' }
    switch (this.consentWindow) {
      case ConsentWindow.Opening:
        consentWindow = `Opens ${formatDate(this.openAt, consentDateStyle)}`
        break
      case ConsentWindow.Closed:
        consentWindow = `Closed ${formatDate(this.closeAt, consentDateStyle)}`
        break
      case ConsentWindow.Open:
        consentWindow = `Open from ${formatDate(this.openAt, consentDateStyle)} until ${formatDate(this.closeAt, consentDateStyle)}`
        break
      default:
        consentWindow = ''
    }

    const nextReminderDate = formatDate(this.nextReminderDate, {
      dateStyle: 'full'
    })

    const reminderWeeks = filters.plural(this.reminderWeeks, 'week')

    return {
      address: this.address?.formatted.multiline,
      dateShort: formatDate(this.date, {
        dateStyle: 'long'
      }),
      date: formatDate(this.date, {
        dateStyle: 'full'
      }),
      nextDate: formatDate(this.date, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }),
      openAt: formatDate(this.openAt, {
        dateStyle: 'full'
      }),
      reminderDate: formatDate(this.reminderDate, {
        dateStyle: 'full'
      }),
      nextReminderDate,
      reminderWeeks: nextReminderDate
        ? formatWithSecondaryText(
            `Send ${reminderWeeks} before each session`,
            `First: ${nextReminderDate}`
          )
        : `Send ${reminderWeeks} before each session`,
      closeAt: formatDate(this.closeAt, { dateStyle: 'full' }),
      patients: filters.plural(this.patients.length, 'child'),
      consents:
        this.consents.length > 0
          ? filters.plural(this.consents.length, 'child')
          : undefined,
      programmes: this.programmes.flatMap(({ nameTag }) => nameTag).join(' '),
      consentUrl:
        this.consentUrl &&
        formatLink(
          this.consentUrl,
          'View the online consent form (opens in new tab)',
          {
            target: '_blank'
          }
        ),
      consentWindow,
      location: Object.values(this.location)
        .filter((string) => string)
        .join(', '),
      clinic: this.clinic && this.clinic.name,
      school: this.school && this.school.name,
      school_urn: this.school && this.school.formatted.urn,
      yearGroups: this.yearGroups && formatYearGroups(this.yearGroups)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} Namespace
   */
  get ns() {
    return 'session'
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/sessions/${this.id}`
  }

  /**
   * Find all
   *
   * @param {object} context - Context
   * @returns {Array<Session>|undefined} Sessions
   * @static
   */
  static findAll(context) {
    return Object.values(context.sessions).map(
      (session) => new Session(session, context)
    )
  }

  /**
   * Find one
   *
   * @param {string} id - Session ID
   * @param {object} context - Context
   * @returns {Session|undefined} Session
   * @static
   */
  static findOne(id, context) {
    if (context?.sessions?.[id]) {
      return new Session(context.sessions[id], context)
    }
  }

  /**
   * Create
   *
   * @param {object} session - Session
   * @param {object} context - Context
   * @returns {Session} Created session
   * @static
   */
  static create(session, context) {
    const createdSession = new Session(session)

    // Update context
    context.sessions = context.sessions || {}
    context.sessions[createdSession.id] = createdSession

    return createdSession
  }

  /**
   * Create file
   *
   * @param {object} context - Context
   * @returns {object} File buffer, name and mime type
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
   * @param {string} id - Session ID
   * @param {object} updates - Updates
   * @param {object} context - Context
   * @returns {Session} Updated session
   * @static
   */
  static update(id, updates, context) {
    const updatedSession = _.merge(Session.findOne(id, context), updates)
    updatedSession.updatedAt = today()

    // Remove session context
    delete updatedSession.context

    // Delete original session (with previous ID)
    delete context.sessions[id]

    // Update context
    context.sessions[updatedSession.id] = updatedSession

    // TODO: Use presenter?
    return new Session(updatedSession, context)
  }

  /**
   * Update register
   *
   * @param {string} patient_uuid
   * @param {import('../enums.js').RegistrationOutcome} registration
   */
  updateRegister(patient_uuid, registration) {
    this.register[patient_uuid] = registration
  }
}
