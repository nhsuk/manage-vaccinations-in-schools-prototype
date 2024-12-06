import { fakerEN_GB as faker } from '@faker-js/faker'

import {
  getCaptureOutcome,
  getRegistrationOutcome,
  getPatientOutcome
} from '../utils/capture.js'
import { getToday, removeDays } from '../utils/date.js'
import {
  getConsentHealthAnswers,
  getConsentOutcome,
  getConsentRefusalReasons,
  getPreferredNames
} from '../utils/reply.js'
import {
  formatLink,
  formatLinkWithSecondaryText,
  formatParent,
  stringToBoolean
} from '../utils/string.js'
import { getScreenOutcome, getTriageOutcome } from '../utils/triage.js'

import { Event, EventType } from './event.js'
import { Gillick } from './gillick.js'
import { NoticeType } from './notice.js'
import { Parent } from './parent.js'
import { Record } from './record.js'
import { Reply } from './reply.js'
import { Vaccination } from './vaccination.js'

export class ConsentOutcome {
  static NoResponse = 'No response'
  static Inconsistent = 'Conflicts'
  static Given = 'Given'
  static Refused = 'Refused'
  static FinalRefusal = 'Refusal confirmed'
}

export class ScreenOutcome {
  static NeedsTriage = 'Needs triage'
  static DelayVaccination = 'Delay vaccination'
  static DoNotVaccinate = 'Do not vaccinate'
  static Vaccinate = 'Safe to vaccinate'
}

export class TriageOutcome {
  static Needed = 'Triage needed'
  static Completed = 'Triage completed'
  static NotNeeded = 'No triage needed'
}

export class CaptureOutcome {
  static Register = 'Register attendance'
  static GetConsent = 'Get consent'
  static CheckRefusal = 'Check refusal'
  static NeedsTriage = 'Triage'
  static DoNotVaccinate = 'Do not vaccinate'
  static Vaccinate = 'Vaccinate'
}

export class PatientOutcome {
  static NoOutcomeYet = 'No outcome yet'
  static Vaccinated = 'Vaccinated'
  static CouldNotVaccinate = 'Could not vaccinate'
}

export class PatientMovement {
  static In = 'Moved in'
  static Out = 'Moved out'
}

/**
 * @class Patient in-session record
 * @property {string} uuid - UUID
 * @property {Array<import('./event.js').Event>} events - Logged events
 * @property {object} replies - Consent replies
 * @property {import('./record.js').Record} record - CHIS record
 * @property {boolean} [registered] - Checked in?
 * @property {Gillick} [gillick] - Gillick assessment
 * @property {object} [vaccinations] - Vaccination UUIDs with given boolean
 * @property {Array<string>} [cohort_uids] - Cohort UIDs
 * @property {Array<string>} [session_ids] - Session IDs
 */
export class Patient {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.events = options?.events || []
    this.replies = options?.replies || {}
    this.record = options?.record && new Record(options.record)
    this.registered = stringToBoolean(options?.registered)
    this.gillick = options?.gillick && new Gillick(options.gillick)
    this.vaccinations = options?.vaccinations || {}
    this.cohort_uids = options?.cohort_uids || []
    this.session_ids = options?.session_ids || []
  }

  /**
   * Generate fake patient
   *
   * @param {Record} record - Record
   * @returns {Patient} Patient
   * @static
   */
  static generate(record) {
    return new Patient({
      nhsn: record.nhsn,
      record
    })
  }

  /**
   * Get NHS number
   *
   * @returns {string} - NHS Number
   */
  get nhsn() {
    return this.record.nhsn
  }

  /**
   * Get first name
   *
   * @returns {string} - First name
   */
  get firstName() {
    return this.record.firstName
  }

  /**
   * Get full name
   *
   * @returns {string} - Full name
   */
  get fullName() {
    return [this.record.firstName, this.record.lastName].join(' ')
  }

  /**
   * Get preferred names (from replies)
   *
   * @returns {string|boolean} - Full name
   */
  get preferredNames() {
    return getPreferredNames(this.replies)
  }

  /**
   * Get parents (from record and replies)
   *
   * @returns {Array<Parent>} - Parents
   */
  get parents() {
    const replies = Object.values(this.replies)
    if (replies.length > 0) {
      return replies.map((reply) => new Parent(reply.parent))
    }
    return [this.record.parent1]
  }

  /**
   * Get events grouped by date
   *
   * @returns {object} - Events grouped by date
   */
  get groupedEvents() {
    const events = this.events.sort(
      (a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf()
    )

    return Object.groupBy(events, (event) => {
      return new Event(event).formatted.date
    })
  }

  /**
   * Get triage notes
   *
   * @returns {Array} - Triage notes
   */
  get triageNotes() {
    return this.events
      .map((event) => new Event(event))
      .filter((event) => event.type === EventType.Screen)
  }

  /**
   * Get reminders sent
   *
   * @returns {Array} - Reminders sent
   */
  get reminders() {
    return this.events
      .map((event) => new Event(event))
      .filter((event) => event.type === EventType.Remind)
  }

  /**
   * Get all notices
   *
   * @returns {Array<Event>} - Notice events
   */
  get notices() {
    return this.events
      .map((event) => new Event(event))
      .filter((event) => event.type === EventType.Notice)
  }

  /**
   * Get most recent notice
   *
   * @returns {Event} - Notice event
   */
  get notice() {
    return this.notices && this.notices[0]
  }

  /**
   * Get date last reminders sent
   *
   * @returns {string|undefined} - Date last reminders sent
   */
  get lastReminderDate() {
    const lastReminder = this.reminders.at(-1)
    if (lastReminder) {
      return lastReminder.formatted.date
    }
  }

  /**
   * Get consent outcome
   *
   * @returns {object} - Consent outcome
   */
  get consent() {
    return getConsentOutcome(this)
  }

  /**
   * Get consent health answers (from replies)
   *
   * @returns {object|boolean} - Consent health answers
   */
  get consentHealthAnswers() {
    return this.session_ids.length > 0
      ? getConsentHealthAnswers(this.replies)
      : false
  }

  /**
   * Get consent refusal reasons (from replies)
   *
   * @returns {object|boolean} - Consent refusal reasons
   */
  get consentRefusalReasons() {
    return this.session_ids.length > 0
      ? getConsentRefusalReasons(this.replies)
      : false
  }

  /**
   * Get screening outcome
   *
   * @returns {object} - Screening outcome
   */
  get screen() {
    return getScreenOutcome(this)
  }

  /**
   * Get triage outcome
   *
   * @returns {object} - Triage outcome
   */
  get triage() {
    return getTriageOutcome(this)
  }

  /**
   * Get registration outcome
   *
   * @returns {object} - Registration outcome
   */
  get registration() {
    return getRegistrationOutcome(this)
  }

  /**
   * Get capture outcome
   *
   * @returns {object} - Capture outcome
   */
  get capture() {
    return getCaptureOutcome(this)
  }

  /**
   * Get overall patient outcome
   *
   * @returns {object} - Overall patient outcome
   */
  get outcome() {
    return getPatientOutcome(this)
  }

  /**
   * Add event to activity log
   *
   * @param {object} event - Event
   */
  addEvent(event) {
    this.events.push(new Event(event))
  }

  /**
   * Select patient for cohort
   *
   * @param {import('./cohort.js').Cohort} cohort - Cohort
   */
  addToCohort(cohort) {
    this.cohort_uids.push(cohort.uid)
    this.addEvent({
      type: EventType.Select,
      name: `Selected for the ${cohort.name} cohort`,
      date: cohort.created,
      user_uid: cohort.created_user_uid
    })
  }

  /**
   * Remove patient from cohort
   *
   * @param {import('./cohort.js').Cohort} cohort - Cohort
   */
  removeFromCohort(cohort) {
    this.cohort_uids = this.cohort_uids.filter((uid) => uid !== cohort.uid)
    this.addEvent({
      type: EventType.Select,
      name: `Removed from the ${cohort.name} cohort`,
      date: cohort.created,
      user_uid: cohort.created_user_uid
    })
  }

  /**
   * Invite patient to session
   *
   * @param {import('./session.js').Session} session - Session
   */
  inviteToSession(session) {
    this.session_ids.push(session.id)
    this.addEvent({
      type: EventType.Invite,
      name: `Invited to session at ${session.location.name}`,
      date: session.created,
      user_uid: session.created_user_uid
    })
  }

  /**
   * Remove patient from session
   *
   * @param {import('./session.js').Session} session - Session
   */
  removeFromSession(session) {
    this.session_ids = this.session_ids.filter((id) => id !== session.id)
    this.addEvent({
      type: EventType.Select,
      name: `Removed from the ${session.name} cohort`,
      date: session.created,
      user_uid: session.created_user_uid
    })
  }

  /**
   * Record sent reminder
   *
   * @param {object} target - Target of reminder
   */
  sendReminder(target) {
    this.addEvent({
      type: EventType.Remind,
      name: `Reminder to give consent sent to ${target.fullName}`,
      date: getToday(),
      user_uid: target.created_user_uid
    })
  }

  /**
   * Assess Gillick competence
   *
   * @param {object} gillick - Gillick
   */
  assessGillick(gillick) {
    const created = this.gillick && !Object.entries(this.gillick).length

    this.gillick = gillick
    this.addEvent({
      type: EventType.Consent,
      name: `${created ? 'Completed' : 'Updated'} Gillick assessment`,
      note: gillick.note,
      date: created ? gillick.created : getToday(),
      user_uid: gillick.created_user_uid
    })
  }

  /**
   * Record reply
   *
   * @param {object} reply - Reply
   */
  addReply(reply) {
    if (!reply) {
      return
    }

    const { decision, fullName, invalid, relationship, uuid } = reply
    const created = !this.replies[uuid]
    const parent = new Parent({ fullName, relationship })
    const formattedParent = formatParent(parent, false)

    let name = `${decision} by ${formattedParent}`
    if (invalid) {
      name = `${decision} by ${formattedParent} marked as invalid`
    } else if (created) {
      name = `${decision} in response from ${formattedParent}`
    } else {
      name = `${decision} in updated response from ${formattedParent}`
    }

    this.replies[uuid] = new Reply(reply)
    this.addEvent({
      type: EventType.Consent,
      name,
      date: created ? reply.created : getToday(),
      user_uid: reply.created_user_uid
    })
  }

  /**
   * Record triage
   *
   * @param {object} triage - Triage
   */
  recordTriage(triage) {
    const outcome =
      triage.outcome === ScreenOutcome.NeedsTriage
        ? 'Keep in triage'
        : triage.outcome

    this.addEvent({
      type: EventType.Screen,
      name: `Triaged decision: ${outcome}`,
      note: triage.note,
      date: getToday(),
      user_uid: triage.created_user_uid,
      info_: triage
    })
  }

  /**
   * Register attendance
   *
   * @param {import('./registration.js').Registration} registration - Registration
   */
  registerAttendance(registration) {
    this.registered = registration.registered
    this.addEvent({
      type: EventType.Capture,
      name: registration.name,
      date: getToday(),
      user_uid: registration.created_user_uid
    })
  }

  /**
   * Record pre-screening interview
   *
   * @param {object} interview - Interview
   */
  preScreen(interview) {
    this.addEvent({
      type: EventType.Screen,
      name: 'Completed pre-screening checks',
      note: interview.note,
      date: getToday(),
      user_uid: interview.user_uid
    })
  }

  /**
   * Capture vaccination
   *
   * @param {import('./vaccination.js').Vaccination} vaccination - Vaccination
   */
  captureVaccination(vaccination) {
    vaccination = new Vaccination(vaccination)

    let name
    if (vaccination.given) {
      name = vaccination.updated
        ? `Vaccination record for ${vaccination.formatted.vaccine_gtin} updated`
        : `Vaccinated with ${vaccination.formatted.vaccine_gtin}`
    } else {
      name = `Unable to vaccinate: ${vaccination.outcome}`
    }

    // Providing a boolean for vaccination enables patient outcome calculation
    this.vaccinations[vaccination.uuid] = vaccination.given

    this.addEvent({
      type: EventType.Capture,
      name,
      note: vaccination.note,
      date: vaccination.updated || vaccination.created,
      user_uid: vaccination.created_user_uid
    })
  }

  /**
   * Add notice
   *
   * @param {import('./notice.js').Notice} notice - Notice
   */
  addNotice(notice) {
    let name
    switch (notice.type) {
      case NoticeType.Deceased:
        // Update patient record with date of death
        this.record.dod = removeDays(getToday(), 5)
        name = `Record updated with child’s date of death`
        break
      case NoticeType.Hidden:
        // Notify request to not share vaccination with GP
        name = `Request for vaccination not to be shared with GP`
        break
      case NoticeType.Invalid:
        // Update patient record with temporary NHS number
        this.record.nhsn = faker.string.alpha(10)
        name = `Record flagged as invalid`
        break
      case NoticeType.Sensitive:
        // Flag record as sensitive
        this.record.sensitive = true
        name = `Record flagged as sensitive`
        break
      default:
    }

    this.addEvent({
      type: EventType.Notice,
      name,
      date: notice.created
    })
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      fullName: formatLink(this.uri, this.fullName),
      fullNameInSession: formatLinkWithSecondaryText(
        this.uriInSession,
        this.fullName,
        this.preferredNames
      )
    }
  }

  /**
   * Get formatted summary
   *
   * @returns {object} - Formatted summaries
   */
  get summary() {
    return {
      dob: `${this.record.formatted.dob}</br>
            <span class="nhsuk-u-secondary-text-color nhsuk-u-font-size-16">
              ${this.record.formatted.yearGroup}
            </span>`
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'patient'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/patients/${this.nhsn}`
  }

  /**
   * Get in session URI
   *
   * @returns {string} - URI
   */
  get uriInSession() {
    return `/sessions/${this.session_ids[0]}/${this.nhsn}`
  }
}
