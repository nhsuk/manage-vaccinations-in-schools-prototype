import { fakerEN_GB as faker } from '@faker-js/faker'

import { getCaptureOutcome, getPatientOutcome } from '../utils/capture.js'
import { getDateValueDifference, today } from '../utils/date.js'
import {
  getConsentOutcome,
  getConsentHealthAnswers,
  getConsentRefusalReasons
} from '../utils/reply.js'
import { formatLink } from '../utils/string.js'
import { getScreenOutcome, getTriageOutcome } from '../utils/triage.js'

import { EventType } from './audit-event.js'
import { Gillick } from './gillick.js'
import { Patient } from './patient.js'
import { Session } from './session.js'

export class ConsentOutcome {
  static NoResponse = 'No response'
  static Inconsistent = 'Conflicting consent'
  static Given = 'Consent given'
  static Refused = 'Consent refused'
  static FinalRefusal = 'Refusal confirmed'
}

export class RegistrationOutcome {
  static Pending = 'Not registered yet'
  static Present = 'Attending today’s session'
  static Absent = 'Absent from today’s session'
  static Complete = 'Completed today’s session'
}

export class TriageOutcome {
  static Needed = 'Triage needed'
  static Completed = 'Triage completed'
  static NotNeeded = 'No triage needed'
}

export class ScreenOutcome {
  static NeedsTriage = 'Needs triage'
  static DelayVaccination = 'Delay vaccination'
  static DoNotVaccinate = 'Do not vaccinate'
  static Vaccinate = 'Safe to vaccinate'
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

/**
 * @class Patient Session
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} uuid - UUID
 * @property {Date} [createdAt] - Created date
 * @property {string} [createdBy_uid] - User who created patient session
 * @property {Date} [updatedAt] - Updated date
 * @property {RegistrationOutcome} [registration] - Registration outcome
 * @property {Gillick} [gillick] - Gillick assessment
 * @property {string} patient_uuid - Patient UUID
 * @property {string} session_id - Session ID
 */
export class PatientSession {
  constructor(options, context) {
    this.context = context
    this.uuid = options?.uuid || faker.string.uuid()
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdBy_uid = options?.createdBy_uid
    this.updatedAt = options?.updatedAt && new Date(options.updatedAt)
    this.registration = options?.registration || RegistrationOutcome.Pending
    this.gillick = options?.gillick && new Gillick(options.gillick)
    this.patient_uuid = options?.patient_uuid
    this.session_id = options?.session_id
  }

  /**
   * Get patient
   *
   * @returns {Patient|undefined} - Patient
   */
  get patient() {
    try {
      const patient = this.context?.patients[this.patient_uuid]
      if (patient) {
        return new Patient(patient, this.context)
      }
    } catch (error) {
      console.error('PatientSession.patient', error.message)
    }
  }

  /**
   * Get replies for patient session
   *
   * @returns {Array<import('./reply.js').Reply>} - Replies
   */
  get replies() {
    return this.patient.replies
      .filter(({ session_id }) => session_id === this.session_id)
      .sort((a, b) => getDateValueDifference(b.createdAt, a.createdAt))
  }

  /**
   * Get session
   *
   * @returns {Session|undefined} - Session
   */
  get session() {
    try {
      return Session.read(this.session_id, this.context)
    } catch (error) {
      console.error('PatientSession.session', error.message)
    }
  }

  /**
   * Get vaccinations for patient session
   *
   * @returns {Array<import('./vaccination.js').Vaccination>|undefined} - Vaccinations
   */
  get vaccinations() {
    try {
      if (this.patient.vaccinations) {
        return this.patient.vaccinations.filter(
          (vaccination) => vaccination.session_id === this.session_id
        )
      }
    } catch (error) {
      console.error('PatientSession.vaccinations', error.message)
    }
  }

  /**
   * Get consent outcome
   *
   * @returns {ConsentOutcome} - Consent outcome
   */
  get consent() {
    return getConsentOutcome(this)
  }

  /**
   * Get consent health answers
   *
   * @returns {object|boolean} - Consent health answers
   */
  get consentHealthAnswers() {
    return getConsentHealthAnswers(this)
  }

  /**
   * Get consent refusal reasons (from replies)
   *
   * @returns {object|boolean} - Consent refusal reasons
   */
  get consentRefusalReasons() {
    return getConsentRefusalReasons(this)
  }

  /**
   * Get screening outcome
   *
   * @returns {ScreenOutcome} - Screening outcome
   */
  get screen() {
    return getScreenOutcome(this)
  }

  /**
   * Get triage outcome
   *
   * @returns {TriageOutcome} - Triage outcome
   */
  get triage() {
    return getTriageOutcome(this)
  }

  /**
   * Get capture outcome
   *
   * @returns {CaptureOutcome|RegistrationOutcome} - Capture outcome
   */
  get capture() {
    return getCaptureOutcome(this)
  }

  /**
   * Get overall patient outcome
   *
   * @returns {PatientOutcome} - Overall patient outcome
   */
  get outcome() {
    return getPatientOutcome(this)
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      fullName: formatLink(this.uri, this.patient.fullName)
    }
  }

  /**
   * Get registration status properties
   *
   * @returns {object} - Status properties
   */
  get registrationStatus() {
    let colour
    let description
    switch (this.registration) {
      case RegistrationOutcome.Present:
        colour = 'green'
        description = `Registered as attending today’s session at ${this.session.location.name}`
        break
      case RegistrationOutcome.Absent:
        colour = 'red'
        description = `Registered as absent from today’s session at ${this.session.location.name}`
        break
      case RegistrationOutcome.Complete:
        colour = 'white'
        break
      default:
        colour = 'blue'
    }

    return {
      colour,
      description,
      text: this.registration
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'patientSession'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/sessions/${this.session_id}/${this.patient.nhsn}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<PatientSession>|undefined} Patient sessions
   * @static
   */
  static readAll(context) {
    return Object.values(context.patientSessions).map(
      (patientSession) => new PatientSession(patientSession, context)
    )
  }

  /**
   * Read
   *
   * @param {string} uuid - Patient UUID
   * @param {object} context - Context
   * @returns {PatientSession|undefined} Patient
   * @static
   */
  static read(uuid, context) {
    if (context?.patientSessions) {
      return new PatientSession(context.patientSessions[uuid], context)
    }
  }

  /**
   * Create
   *
   * @param {PatientSession} patientSession - Patient session
   * @param {object} context - Context
   */
  create(patientSession, context) {
    patientSession = new PatientSession(patientSession)

    // Update context
    context.patientSessions = context.patientSessions || {}
    context.patientSessions[patientSession.uuid] = patientSession
  }

  /**
   * Update
   *
   * @param {object} updates - Updates
   * @param {object} context - Context
   */
  update(updates, context) {
    this.updatedAt = new Date()

    // Remove patient context
    delete this.context

    // Delete original patient session (with previous UUID)
    delete context.patientSessions[this.uuid]

    // Update context
    const updatedPatientSession = Object.assign(this, updates)
    context.patientSessions[updatedPatientSession.uuid] = updatedPatientSession
  }

  /**
   * Delete
   *
   * @param {object} context - Context
   */
  delete(context) {
    delete context.patientSessions[this.uuid]
  }

  /**
   * Remove patient from session
   *
   * @param {import('./audit-event.js').AuditEvent} event - Event
   */
  removeFromSession(event) {
    this.patient.patientSession_uuids =
      this.patient.patientSession_uuids.filter((uuid) => uuid !== this.uuid)
    this.patient.addEvent({
      type: EventType.Select,
      name: `Removed from the ${this.session.name}`,
      createdBy_uid: event.createdBy_uid
    })
  }

  /**
   * Assess Gillick competence
   *
   * @param {object} event - Event
   * @param {Gillick} gillick - gillick
   */
  assessGillick(event, gillick) {
    this.patient.addEvent({
      type: EventType.Consent,
      name: gillick.status.description,
      note: gillick.note,
      createdAt: gillick.createdAt,
      createdBy_uid: event.createdBy_uid
    })

    const patientSession = PatientSession.read(this.uuid, this.context)
    patientSession.update({ gillick }, this.context)
  }

  /**
   * Record triage
   *
   * @param {import('./audit-event.js').AuditEvent} event - Event
   */
  recordTriage(event) {
    this.patient.addEvent({
      type: EventType.Screen,
      name: event.name,
      note: event.note,
      createdBy_uid: event.createdBy_uid,
      info_: event.info_ // Store outcome, used to calculate screen outcome
    })
  }

  /**
   * Register attendance
   *
   * @param {import('./audit-event.js').AuditEvent} event - Event
   * @param {RegistrationOutcome} registration - Registration
   */
  registerAttendance(event, registration) {
    this.registration = registration
    this.patient.addEvent({
      type: EventType.Capture,
      name: this.registrationStatus.description,
      createdAt: event.createdAt,
      createdBy_uid: event.createdBy_uid
    })

    // Update context, so that session activity reflects updated value
    // TODO: Why is this needed?
    const patientSession = PatientSession.read(this.uuid, this.context)
    patientSession.update({ registration }, this.context)
  }

  /**
   * Record pre-screening interview
   *
   * @param {import('./audit-event.js').AuditEvent} event - Event
   */
  preScreen(event) {
    this.patient.addEvent({
      type: EventType.Screen,
      name: 'Completed pre-screening checks',
      note: event.note,
      createdBy_uid: event.createdBy_uid
    })
  }

  /**
   * Record sent reminder
   *
   * @param {import('./audit-event.js').AuditEvent} event - Event
   * @param {import('./parent.js').Parent} parent - Parent
   */
  sendReminder(event, parent) {
    this.patient.addEvent({
      type: EventType.Remind,
      name: `Reminder to give consent sent to ${parent.fullName}`,
      createdBy_uid: event.createdBy_uid
    })
  }
}