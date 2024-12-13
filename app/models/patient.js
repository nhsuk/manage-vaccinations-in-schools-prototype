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
import { formatLink, formatParent, stringToBoolean } from '../utils/string.js'
import { getScreenOutcome, getTriageOutcome } from '../utils/triage.js'

import { Cohort } from './cohort.js'
import { Event, EventType } from './event.js'
import { Gillick } from './gillick.js'
import { NoticeType } from './notice.js'
import { Parent } from './parent.js'
import { Record } from './record.js'
import { Reply } from './reply.js'
import { Session } from './session.js'
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
 * @augments Record
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} uuid - UUID
 * @property {Array<import('./event.js').Event>} events - Logged events
 * @property {boolean} [registered] - Checked in?
 * @property {Gillick} [gillick] - Gillick assessment
 * @property {Array<string>} [cohort_uids] - Cohort UIDs
 * @property {Array<string>} [reply_uuids] - Reply IDs
 * @property {Array<string>} [session_ids] - Session IDs
 */
export class Patient extends Record {
  constructor(options, context) {
    super(options, context)

    this.context = context
    this.uuid = options?.uuid || faker.string.uuid()
    this.events = options?.events || []
    this.registered = stringToBoolean(options?.registered)
    this.gillick = options?.gillick && new Gillick(options.gillick)
    this.cohort_uids = options?.cohort_uids || []
    this.reply_uuids = options?.reply_uuids || []
    this.session_ids = options?.session_ids || []
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
    const parents = new Map()
    super.parents.forEach((parent) =>
      parents.set(parent.uuid, new Parent(parent))
    )

    // Add any new parents found in consent replies
    Object.values(this.replies).forEach(({ parent }) => {
      if (!parents.has(parent.uuid)) {
        parents.set(parent.uuid, new Parent(parent))
      }
    })

    return [...parents.values()]
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
   * Get cohorts
   *
   * @returns {Array<Cohort>} - Cohorts
   */
  get cohorts() {
    if (this.context?.cohorts && this.cohort_uids) {
      return this.cohort_uids.map(
        (uid) => new Cohort(this.context?.cohorts[uid], this.context)
      )
    }

    return []
  }

  /**
   * Get replies
   *
   * @returns {Array<Reply>} - Replies
   */
  get replies() {
    if (this.context?.replies && this.reply_uuids) {
      return this.reply_uuids.map(
        (uuid) => new Reply(this.context?.replies[uuid], this.context)
      )
    }

    return []
  }

  /**
   * Get sessions
   *
   * @returns {Array<Session>} - Sessions
   */
  get sessions() {
    if (this.context?.sessions && this.session_ids) {
      return this.session_ids.map(
        (id) => new Session(this.context?.sessions[id], this.context)
      )
    }

    return []
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
   * Get consent health answers (from replies, for a given session)
   *
   * @param {string} session_id - Session ID
   * @returns {object|boolean} - Consent health answers
   */
  consentHealthAnswers(session_id) {
    return session_id
      ? getConsentHealthAnswers(this.replies, session_id)
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
  selectForCohort(cohort) {
    this.cohort_uids.push(cohort.uid)
    this.addEvent({
      type: EventType.Select,
      name: `Selected for the ${cohort.name.replace('Flu', 'flu')} cohort`,
      date: cohort.created,
      user_uid: cohort.created_user_uid
    })
  }

  /**
   * Reject patient from cohort
   *
   * @param {import('./cohort.js').Cohort} cohort - Cohort
   */
  rejectFromCohort(cohort) {
    this.cohort_uids = this.cohort_uids.filter((uid) => uid !== cohort.uid)
    this.addEvent({
      type: EventType.Select,
      name: `Removed from the ${cohort.name.replace('Flu', 'flu')} cohort`,
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

    this.reply_uuids.push(reply.uuid)
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
    this.vaccination_uuids.push(vaccination.uuid)

    vaccination = new Vaccination(vaccination)
    let name
    if (vaccination.given) {
      name = vaccination.updated
        ? `Vaccination record for ${vaccination.formatted.vaccine_gtin} updated`
        : `Vaccinated with ${vaccination.formatted.vaccine_gtin}`
    } else {
      name = `Unable to vaccinate: ${vaccination.outcome}`
    }

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
        this.dod = removeDays(getToday(), 5)
        name = `Record updated with child’s date of death`
        break
      case NoticeType.Hidden:
        // Notify request to not share vaccination with GP
        name = `Request for vaccination not to be shared with GP`
        break
      case NoticeType.Invalid:
        // Update patient record with temporary NHS number
        this.nhsn = faker.string.alpha(10)
        name = `Record flagged as invalid`
        break
      case NoticeType.Sensitive:
        // Flag record as sensitive
        this.sensitive = true
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
      fullName: formatLink(this.uri, this.fullName)
    }
  }

  /**
   * Get formatted summary
   *
   * @returns {object} - Formatted summaries
   */
  get summary() {
    return {
      dob: `${this.formatted.dob}</br>
        <span class="nhsuk-u-secondary-text-color nhsuk-u-font-size-16">
          ${this.formatted.yearGroup}
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
}
