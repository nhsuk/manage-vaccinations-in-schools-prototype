import { fakerEN_GB as faker } from '@faker-js/faker'
import { default as filters } from '@x-govuk/govuk-prototype-filters'
import { isAfter } from 'date-fns'
import _ from 'lodash'

import {
  AcademicYear,
  Activity,
  ConsentOutcome,
  ConsentWindow,
  InstructionOutcome,
  OrganisationDefaults,
  PatientOutcome,
  ProgrammePreset,
  ScreenOutcome,
  SessionStatus,
  SessionType,
  VaccineMethod
} from '../enums.js'
import {
  removeDays,
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  formatDateRange,
  getAcademicYear,
  includesDate,
  setMidday,
  today
} from '../utils/date.js'
import { tokenize } from '../utils/object.js'
import { getConsentWindow, getSessionActivityCount } from '../utils/session.js'
import {
  formatLink,
  formatLinkWithSecondaryText,
  formatList,
  formatProgrammeId,
  formatTag,
  formatWithSecondaryText,
  sentenceCaseProgrammeName,
  stringToArray,
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
 * @property {Array<Date>} [dates] - Dates
 * @property {Array<object>} [dates_] - Dates (from `dateInput`s)
 * @property {Date} [openAt] - Date consent window opens
 * @property {object} [openAt_] - Date consent window opens (from `dateInput`)
 * @property {boolean} [closed] - Session closed
 * @property {number} [reminderWeeks] - Weeks before session to send reminders
 * @property {boolean} [registration] - Does session have registration?
 * @property {object} [register] - Patient register
 * @property {string} [programmePreset] - Programme preset name
 * @property {AcademicYear} [academicYear] - Programme year
 * @property {Array<string>} [catchupProgrammeTypes] - Catchup programmes
 * @property {boolean} [nationalProtocol] - Enable national protocol
 * @property {boolean} [psdProtocol] - Enable PSD protocol
 */
export class Session {
  constructor(options, context) {
    const latestAcademicYear = Object.values(AcademicYear).at(-1)

    this.context = context
    this.id = options?.id || faker.helpers.replaceSymbols('###')
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdBy_uid = options?.createdBy_uid
    this.type = options?.type || SessionType.School
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
    this.registration = stringToBoolean(options?.registration)
    this.register = options?.register || {}
    this.academicYear = options?.academicYear || latestAcademicYear
    this.programmePreset = options?.programmePreset
    this.catchupProgrammeTypes = stringToArray(options?.catchupProgrammeTypes)
    this.psdProtocol = stringToBoolean(options?.psdProtocol) || false

    if (this.programmePreset === 'SeasonalFlu') {
      this.nationalProtocol =
        stringToBoolean(options?.nationalProtocol) || false
    }
  }

  /**
   * Get session dates for `dateInput`s
   *
   * @returns {Array<object|undefined>} `dateInput` objects
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
   * Get first session date
   *
   * @returns {Date} First session date
   */
  get firstDate() {
    return this.dates[0]
  }

  /**
   * Get last session date
   *
   * @returns {Date} Last session date
   */
  get lastDate() {
    return this.dates.at(-1)
  }

  /**
   * Get remaining session dates
   *
   * @returns {Array<Date>} Remaining session dates
   */
  get remainingDates() {
    const remainingDates = [...this.dates]
    remainingDates.shift()

    return remainingDates
  }

  /**
   * Get next session date
   *
   * @returns {Date} Next session dates
   */
  get nextDate() {
    return this.remainingDates[0]
  }

  /**
   * Get dates reminders to give consent are sent
   *
   * @returns {Array<Date>|undefined} Reminder dates
   */
  get reminderDates() {
    const reminderDates = []
    for (const date of this.dates) {
      reminderDates.push(removeDays(date, 7))
    }

    return reminderDates
  }

  /**
   * Get date next automated reminder will be sent
   *
   * @returns {Date|undefined} Next reminder date
   */
  get nextReminderDate() {
    if (this.dates.length > 0) {
      return removeDays(this.dates[0], this.reminderWeeks * 7)
    }
  }

  /**
   * Get consent close date
   *
   * @returns {Date|undefined} Consent close date
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
   * @returns {Array<import('./consent.js').Consent>} Consent
   */
  get consents() {
    return Consent.findAll(this.context).filter(
      ({ session_id }) => session_id === this.id
    )
  }

  /**
   * Get consent form URL
   *
   * @returns {string} Consent form URL
   */
  get consentUrl() {
    return `/give-or-refuse-consent/${this.id}`
  }

  get consentForms() {
    if (!this.isUnplanned) {
      let forms = [this.formatted.consentUrl]

      for (const programme of this.programmes) {
        forms = [...forms, programme.formatted.consentPdf]
      }

      return formatList(forms).replace(' nhsuk-list--bullet', '')
    }

    return []
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
    return includesDate(this.dates, setMidday(today()))
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
    const academicYear = Number(this.academicYear.split(' ')[0])
    const currentYear = Number(getAcademicYear(today()).split(' ')[0])

    return academicYear < currentYear
  }

  /**
   * Get status
   *
   * @returns {string} Status
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
   * @returns {Clinic|undefined}} Clinic
   */
  get clinic() {
    if (this.clinic_id) {
      try {
        return Clinic.read(this.clinic_id, this.context)
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
        return School.read(this.school_urn, this.context)
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
  get primaryProgramme_ids() {
    const programme_ids = new Set()

    if (this.programmePreset) {
      const preset = ProgrammePreset[this.programmePreset]
      for (const programmeType of preset.primaryProgrammeTypes) {
        const id = formatProgrammeId(programmeType, this.academicYear)
        programme_ids.add(id)
      }
    }

    return [...programme_ids]
  }

  /**
   * Get catch-up programme ids
   *
   * @returns {Array<string>} Programme IDs
   */
  get catchupProgramme_ids() {
    const programme_ids = new Set()

    if (this.catchupProgrammeTypes) {
      const catchupProgrammeTypes = this.catchupProgrammeTypes?.filter(
        (type) => type !== '_unchecked'
      )
      for (const programmeType of catchupProgrammeTypes) {
        const id = formatProgrammeId(programmeType, this.academicYear)
        programme_ids.add(id)
      }
    }

    return [...programme_ids]
  }

  /**
   * Get programme ids
   *
   * @returns {Array<string>} Programme IDs
   */
  get programme_ids() {
    return [...this.primaryProgramme_ids, ...this.catchupProgramme_ids]
  }

  /**
   * Get primary programmes
   *
   * @returns {Array<Programme>} Programmes
   */
  get primaryProgrammes() {
    return this.primaryProgramme_ids
      .map((id) => Programme.read(id, this.context))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Get catch-up programmes
   *
   * @returns {Array<Programme>} Programmes
   */
  get catchupProgrammes() {
    return this.catchupProgramme_ids
      .map((id) => Programme.read(id, this.context))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Get session programmes
   *
   * @returns {Array<Programme>} Programmes
   */
  get programmes() {
    return this.programme_ids
      .map((id) => Programme.read(id, this.context))
      .sort((a, b) => a.name.localeCompare(b.name))
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
      this.primaryProgrammes.length === 1 ? 'vaccination' : 'vaccinations'

    return {
      sentenceCase: `${filters.formatList(
        this.primaryProgrammes.map(({ name }) =>
          sentenceCaseProgrammeName(name)
        )
      )} ${pluralisation}`,
      titleCase: `${filters.formatList(this.primaryProgrammes.map(({ name }) => name))}
        ${pluralisation}`
    }
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
    if (this.location) {
      return `${this.programmeNames.titleCase} session at ${this.location.name}`
    }
  }

  /**
   * Get session activity counts
   *
   * @returns {object} Session activity counts
   */
  get activity() {
    return {
      addNhsNumber: getSessionActivityCount(this, [
        {
          'patient.hasMissingNhsNumber': true
        }
      ]),
      checkGiven: getSessionActivityCount(this, [
        {
          consentGiven: true
        }
      ]),
      checkGivenForNasalSpray: getSessionActivityCount(this, [
        {
          consent: ConsentOutcome.GivenForNasalSpray
        }
      ]),
      checkGivenForInjection: getSessionActivityCount(this, [
        {
          consent: ConsentOutcome.GivenForInjection
        }
      ]),
      checkRefusal: getSessionActivityCount(this, [
        {
          consent: ConsentOutcome.Refused
        }
      ]),
      triage: getSessionActivityCount(this, [
        {
          screen: ScreenOutcome.NeedsTriage
        }
      ]),
      instruct: getSessionActivityCount(this, [
        {
          nextActivity: Activity.Record,
          instruct: InstructionOutcome.Needed
        }
      ]),
      recordVaccination: getSessionActivityCount(this, [
        {
          nextActivity: Activity.Record
        }
      ]),
      report: getSessionActivityCount(this, [
        {
          outcome: PatientOutcome.Vaccinated
        }
      ]),
      reportNasalSprays: getSessionActivityCount(this, [
        {
          outcome: PatientOutcome.Vaccinated,
          'vaccine.method': VaccineMethod.Nasal
        }
      ]),
      reportInjections: getSessionActivityCount(this, [
        {
          outcome: PatientOutcome.Vaccinated,
          'vaccine.method': VaccineMethod.Injection
        }
      ])
    }
  }

  get dateSummary() {
    if (this.dates.length > 0) {
      const range = formatDateRange(this.firstDate, this.lastDate, {
        dateStyle: 'long'
      })
      return `${range} (${this.dates.length} sessions)`
    } else if (this.dates.length === 1) {
      return this.formatted.lastDate
    }

    return 'No sessions scheduled'
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
        ({ consentGiven, report }) =>
          consentGiven && report !== PatientOutcome.Vaccinated
      )
    }
  }

  /**
   * Get patient sessions that can be moved to a clinic session
   *
   * @returns {Array<PatientSession>} Patient sessions
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
      .filter(({ report }) =>
        [
          PatientOutcome.CouldNotVaccinate,
          PatientOutcome.NoOutcomeYet
        ].includes(report)
      )
  }

  get details() {
    return `<div>
      <p>${this.link.nameAndAddress}</p>
      <p>${this.dateSummary}</p>
    </div>`
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

    const formattedReminderDates =
      this.reminderDates.length > 0
        ? this.reminderDates.map((date) =>
            formatDate(date, { dateStyle: 'full' })
          )
        : []

    const formattedNextReminderDate = formatDate(this.nextReminderDate, {
      dateStyle: 'full'
    })

    const reminderWeeks = filters.plural(this.reminderWeeks, 'week')

    const programmePresetHasCatchups =
      ProgrammePreset[this.programmePreset]?.catchupProgrammeTypes

    return {
      address: this.address?.formatted.multiline,
      dates: formatList(formattedDates).replace(' nhsuk-list--bullet', ''),
      firstDate: formatDate(this.firstDate, { dateStyle: 'full' }),
      nextDate: formatDate(this.nextDate, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }),
      openAt: formatDate(this.openAt, { dateStyle: 'full' }),
      reminderDates: formatList(formattedReminderDates).replace(
        ' nhsuk-list--bullet',
        ''
      ),
      nextReminderDate: formattedNextReminderDate,
      reminderWeeks: formattedNextReminderDate
        ? formatWithSecondaryText(
            `Send ${reminderWeeks} before each session`,
            `First: ${formattedNextReminderDate}`
          )
        : `Send ${reminderWeeks} before each session`,
      closeAt: formatDate(this.closeAt, { dateStyle: 'full' }),
      patients: filters.plural(this.patients.length, 'child'),
      consents:
        this.consents.length > 0
          ? filters.plural(this.consents.length, 'child')
          : undefined,
      primaryProgrammes: this.primaryProgrammes
        .flatMap(({ nameTag }) => nameTag)
        .join(' '),
      catchupProgrammes: this.catchupProgrammes?.length
        ? this.catchupProgrammes.flatMap(({ nameTag }) => nameTag).join(' ')
        : programmePresetHasCatchups
          ? null // Show row with link to add catch-up programmes
          : '', // Hide row
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
      school: this.school && this.school.name,
      school_urn: this.school && this.school.formatted.urn,
      status: formatTag(this.sessionStatus)
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} Formatted links
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
   * @returns {object} Formatted summaries
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
      dates: filters.formatList(dates),
      datesDisjunction: filters.formatList(dates, 'disjunction'),
      firstDate,
      remainingDates: filters.formatList(remainingDates),
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
   * @returns {object} Status properties
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
   * Read
   *
   * @param {string} id - Session ID
   * @param {object} context - Context
   * @returns {Session|undefined} Session
   * @static
   */
  static read(id, context) {
    if (context?.sessions?.[id]) {
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
   * @param {object} updates - Updates
   * @param {object} context - Context
   */
  update(updates, context) {
    this.updatedAt = today()

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

  /**
   * Update register
   *
   * @param {string} patient_uuid
   * @param {import('../enums.js').RegistrationOutcome} registration
   */
  updateRegister(patient_uuid, registration) {
    const register = {
      ...this.register,
      ...{ [patient_uuid]: registration }
    }

    this.update({ register }, this.context)
  }
}
