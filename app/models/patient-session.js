import { fakerEN_GB as faker } from '@faker-js/faker'
import filters from '@x-govuk/govuk-prototype-filters'

import { getDateValueDifference, today } from '../utils/date.js'
import {
  getInstructionOutcome,
  getInstructionStatus,
  getNextActivity,
  getRegistrationOutcome,
  getReportOutcome,
  getConsentStatus,
  getOutcomeStatus,
  getRegistrationStatus,
  getReportStatus,
  getSessionOutcome,
  getScreenStatus,
  getTriageStatus
} from '../utils/patient-session.js'
import {
  getConsentOutcome,
  getConsentHealthAnswers,
  getConsentRefusalReasons
} from '../utils/reply.js'
import {
  formatLink,
  formatList,
  formatProgrammeStatus,
  formatTag
} from '../utils/string.js'
import { getScreenOutcome, getTriageOutcome } from '../utils/triage.js'

import { EventType } from './audit-event.js'
import { Gillick } from './gillick.js'
import { Instruction } from './instruction.js'
import { Patient } from './patient.js'
import { Programme, ProgrammeType } from './programme.js'
import { ReplyDecision } from './reply.js'
import { Session } from './session.js'
import { VaccineMethod } from './vaccine.js'

/**
 * @readonly
 * @enum {string}
 */
export const Activity = {
  Consent: 'Get consent',
  Triage: 'Triage health questions',
  Register: 'Register attendance',
  Record: 'Record vaccination',
  DoNotRecord: 'Do not vaccinate',
  Report: 'Report vaccination'
}

/**
 * @readonly
 * @enum {string}
 */
export const ConsentOutcome = {
  NoRequest: 'Request failed',
  NoResponse: 'No response',
  Inconsistent: 'Conflicting consent',
  Given: 'Consent given',
  Declined: 'Follow up requested',
  Refused: 'Consent refused',
  FinalRefusal: 'Refusal confirmed'
}

/**
 * @readonly
 * @enum {string}
 */
export const TriageOutcome = {
  Needed: 'Triage needed',
  Completed: 'Triage completed',
  NotNeeded: 'No triage needed'
}

/**
 * @readonly
 * @enum {string}
 */
export const ScreenOutcome = {
  Vaccinate: 'Safe to vaccinate',
  VaccinateInjection: 'Safe to vaccinate with injected vaccine',
  VaccinateNasal: 'Safe to vaccinate with nasal spray',
  NeedsTriage: 'Needs triage',
  DelayVaccination: 'Delay vaccination',
  DoNotVaccinate: 'Do not vaccinate'
}

/**
 * @readonly
 * @enum {string}
 */
export const PatientOutcome = {
  Vaccinated: 'Vaccinated',
  CouldNotVaccinate: 'Could not vaccinate',
  NoOutcomeYet: 'No outcome yet'
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
 * @property {Gillick} [gillick] - Gillick assessment
 * @property {Array<AuditEvent>} [notes] - Session notes
 * @property {string} patient_uuid - Patient UUID
 * @property {string} instruction_uuid - Instruction UUID
 * @property {string} programme_id - Programme ID
 * @property {string} session_id - Session ID
 */
export class PatientSession {
  constructor(options, context) {
    this.context = context
    this.uuid = options?.uuid || faker.string.uuid()
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdBy_uid = options?.createdBy_uid
    this.updatedAt = options?.updatedAt && new Date(options.updatedAt)
    this.gillick = options?.gillick && new Gillick(options.gillick)
    this.notes = options?.notes || []
    this.patient_uuid = options?.patient_uuid
    this.instruction_uuid = options?.instruction_uuid
    this.programme_id = options?.programme_id
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
   * Get instruction
   *
   * @returns {Instruction|undefined} - Instruction
   */
  get instruction() {
    try {
      return Instruction.read(this.instruction_uuid, this.context)
    } catch (error) {
      console.error('PatientSession.instruction', error.message)
    }
  }

  /**
   * Get audit events for patient session
   *
   * @returns {Array<import('./audit-event.js').AuditEvent>} - Audit events
   */
  get auditEvents() {
    return this.patient.auditEvents.filter(({ programme_ids }) =>
      programme_ids?.some((id) => this.session.programme_ids.includes(id))
    )
  }

  /**
   * Get audit events grouped by date
   *
   * @returns {object} - Events grouped by date
   */
  get auditEventLog() {
    const auditEvents = this.auditEvents.sort((a, b) =>
      getDateValueDifference(b.createdAt, a.createdAt)
    )

    return Object.groupBy(auditEvents, (auditEvent) => {
      return auditEvent.formatted.createdAt
    })
  }

  /**
   * Get triage notes
   *
   * @returns {Array<import('./audit-event.js').AuditEvent>} - Audit events
   */
  get triageNotes() {
    return this.auditEvents
      .filter(({ programme_ids }) => programme_ids.includes(this.programme_id))
      .filter(({ type }) => type === EventType.Screen)
  }

  /**
   * Get latest session note
   *
   * @returns {import('./audit-event.js').AuditEvent} - Audit event
   */
  get latestNote() {
    return this.auditEvents
      .filter(({ programme_ids }) => programme_ids.includes(this.programme_id))
      .sort((a, b) => getDateValueDifference(b.createdAt, a.createdAt))
      .find(({ type }) => type === EventType.Unknown)
  }

  /**
   * Get replies for patient session
   *
   * @returns {Array<import('./reply.js').Reply>} - Replies
   */
  get replies() {
    return this.patient.replies
      .filter(({ programme_id }) => programme_id === this.programme_id)
      .sort((a, b) => getDateValueDifference(b.createdAt, a.createdAt))
  }

  /** Get parental relationships from valid replies
   *
   * @returns {Array<string>} - Parental relationships
   */
  get parentalRelationships() {
    return this.responses
      .filter((reply) => !reply.invalid)
      .flatMap((reply) => reply.relationship || 'Parent or guardian')
  }

  /** Get names of parents who have requested a follow up
   *
   * @returns {Array<string>} - Parent names and relationships
   */
  get parentsRequestingFollowUp() {
    return this.responses
      .filter((reply) => !reply.invalid)
      .filter((reply) => reply.declined)
      .flatMap((reply) => reply.parent.formatted.fullNameAndRelationship)
  }

  /**
   * Get responses (consent requests that were delivered)
   *
   * @returns {Array<import('./reply.js').Reply>} - Responses
   */
  get responses() {
    return this.replies.filter((reply) => reply.delivered)
  }

  /**
   * Has every parent given consent for an injected vaccine?
   *
   * Some parents may give consent for the nasal spray, but also given consent
   * for the injection as an alternative
   *
   * @returns {boolean} Consent given for an injected vaccine
   */
  get hasConsentForInjection() {
    return this.responses.every(
      ({ hasConsentForInjection }) => hasConsentForInjection
    )
  }

  /**
   * Has every parent given consent only for an injected vaccine?
   *
   * We need this so that we don’t offer multiple triage outcomes if consent has
   * only been given for the injected vaccine
   *
   * @returns {boolean} Consent given for an injected vaccine
   */
  get hasConsentForInjectionOnly() {
    return this.responses.every(
      ({ decision }) => decision === ReplyDecision.OnlyFluInjection
    )
  }

  get triageOutcomesForConsentedMethod() {
    return [
      ...(!this.programme.hasAlternativeVaccines
        ? [ScreenOutcome.Vaccinate]
        : []),
      ...(this.programme.hasAlternativeVaccines &&
      !this.hasConsentForInjectionOnly
        ? [ScreenOutcome.VaccinateNasal]
        : []),
      ...(this.programme.hasAlternativeVaccines && this.hasConsentForInjection
        ? [ScreenOutcome.VaccinateInjection]
        : []),
      'or',
      ScreenOutcome.NeedsTriage,
      ScreenOutcome.DelayVaccination,
      ScreenOutcome.DoNotVaccinate
    ]
  }

  /**
   * Get agreed upon vaccination method
   *
   * For all programmes besides flu, this will be an injection.
   * For the flu programme, this depends on consent responses
   *
   * @returns {VaccineMethod} - Vaccine method
   */
  get vaccineMethod() {
    if (this.programme.type !== ProgrammeType.Flu) {
      return VaccineMethod.Injection
    }

    const hasScreenedForInjection =
      this.screen === ScreenOutcome.VaccinateInjection

    return this.hasConsentForInjection || hasScreenedForInjection
      ? VaccineMethod.Injection
      : VaccineMethod.Nasal
  }

  /**
   * Get programme
   *
   * @returns {Programme|undefined} - Programme
   */
  get programme() {
    try {
      return Programme.read(this.programme_id, this.context)
    } catch (error) {
      console.error('PatientSession.programme', error.message)
    }
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
   * Get related patient sessions
   *
   * @returns {Array<PatientSession>} - Patient sessions
   */
  get siblingPatientSessions() {
    try {
      return PatientSession.readAll(this.context)
        .filter(({ patient_uuid }) => patient_uuid === this.patient_uuid)
        .filter(({ session_id }) => session_id === this.session_id)
        .sort((a, b) => a.programme.name.localeCompare(b.programme.name))
    } catch (error) {
      console.error('PatientSession.siblingPatientSessions', error.message)
    }
  }

  /**
   * Get vaccine to administer in this patient session
   * In most cases, this will return the single available injected vaccine
   * but for the flu programme, this may return the nasal spray
   *
   * @returns {import('./vaccine.js').Vaccine} - Vaccine
   */
  get vaccine() {
    return this.programme.vaccines.find(
      (vaccine) => vaccine.method === this.vaccineMethod
    )
  }

  /**
   * Get vaccinations for patient session
   *
   * @returns {Array<import('./vaccination.js').Vaccination>|undefined} - Vaccinations
   */
  get vaccinations() {
    try {
      if (this.patient.vaccinations && this.programme_id) {
        return this.patient.vaccinations.filter(
          ({ programme }) => programme.id === this.programme_id
        )
      }
    } catch (error) {
      console.error('PatientSession.vaccinations', error.message)
    }
  }

  /**
   * Get next activity
   *
   * @returns {Activity} Activity
   */
  get nextActivity() {
    return getNextActivity(this)
  }

  /**
   * Get next activity, per programme
   *
   * @returns {object} - Patient sessions per programme
   */
  get nextActivityPerProgramme() {
    const programmes = {}
    for (const patientSession of this.siblingPatientSessions) {
      programmes[patientSession.programme.name] =
        getNextActivity(patientSession)
    }

    return programmes
  }

  /**
   * Get next activity, per programme
   *
   * @returns {Array<PatientSession>} - Patient sessions per programme
   */
  get outstandingVaccinations() {
    return this.siblingPatientSessions.filter(
      ({ nextActivity }) => nextActivity === Activity.Record
    )
  }

  /**
   * Get reason could not vaccinate
   *
   * @returns {string|undefined} Reason could not vaccinate
   */
  get couldNotVaccinateReason() {
    if (this.vaccinations.length) {
      return this.vaccinations[0].outcome
    } else if (this.screen && this.consent !== ConsentOutcome.Given) {
      return this.status.consent.reason
    } else if (this.screen && this.screen !== ScreenOutcome.Vaccinate) {
      return this.status.screen.reason
    } else if (!this.screen) {
      return this.status.consent.reason
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
   * Get responses with triage notes for consent health answers
   *
   * @returns {Array} - Triage notes
   */
  get responsesWithTriageNotes() {
    return this.responses.filter((response) => response.triageNote)
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
   * @returns {ScreenOutcome|boolean} - Screening outcome
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
   * Get instruction outcome
   *
   * @returns {import('./instruction.js').InstructionOutcome} - Instruction outcome
   */
  get instruct() {
    return getInstructionOutcome(this)
  }

  /**
   * Get registration outcome
   *
   * @returns {import('./session.js').RegistrationOutcome} - Registration outcome
   */
  get register() {
    return getRegistrationOutcome(this)
  }

  /**
   * Get last recorded vaccination
   *
   * @returns {import('./vaccination.js').Vaccination} - Vaccination
   */
  get lastRecordedVaccination() {
    if (this.vaccinations.length > 0) {
      return this.vaccinations.at(-1)
    }
  }

  /**
   * Get vaccination (session) outcome
   *
   * @returns {import('./vaccination.js').VaccinationOutcome|PatientOutcome} - Vaccination (session) outcome
   */
  get outcome() {
    return getSessionOutcome(this)
  }

  /**
   * Get patient (programme) outcome
   *
   * @returns {PatientOutcome} - Overall patient (programme) outcome
   */
  get report() {
    return getReportOutcome(this)
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
   * Get status properties per activity
   *
   * @returns {object} - Status properties
   */
  get status() {
    return {
      consent: getConsentStatus(this),
      triage: getTriageStatus(this),
      screen: getScreenStatus(this),
      instruct: getInstructionStatus(this),
      register: getRegistrationStatus(this),
      outcome: getOutcomeStatus(this),
      report: getReportStatus(this)
    }
  }

  get reason() {
    let consent
    if (this.consent === ConsentOutcome.NoResponse) {
      consent = this.patient.formatted.lastReminderDate
    } else if (
      [ConsentOutcome.Refused, ConsentOutcome.FinalRefusal].includes(
        this.consent
      )
    ) {
      consent = this.consentRefusalReasons.join('<br>')
    } else if (
      this.consent === ConsentOutcome.Given &&
      this.programme.hasAlternativeVaccines
    ) {
      if (this.hasConsentForInjectionOnly) {
        consent = 'Injection'
      } else {
        consent = 'Nasal spray'
        consent += this.hasConsentForInjection ? ' (or injection)' : ''
      }
    }

    return {
      consent,
      triage:
        this.triage === TriageOutcome.Completed && this.status.screen.reason,
      report:
        this.report === PatientOutcome.CouldNotVaccinate &&
        this.couldNotVaccinateReason
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    const nextActivityPerProgramme = this.siblingPatientSessions
      .filter(({ nextActivity }) => nextActivity !== Activity.Report)
      .map(
        ({ nextActivity, programme }) => `${nextActivity} for ${programme.name}`
      )

    const outstandingVaccinations = this.outstandingVaccinations.map(
      ({ programme }) => programme.name
    )

    return {
      programme: this.programme.nameTag,
      status: {
        consent: formatProgrammeStatus(
          this.programme,
          this.status.consent,
          this.reason.consent
        ),
        screen:
          this.screen &&
          formatProgrammeStatus(
            this.programme,
            this.status.screen,
            this.reason.screen
          ),
        instruct: formatTag(this.status.instruct),
        register: formatTag(this.status.register),
        outcome: formatProgrammeStatus(this.programme, this.status.outcome),
        report: formatProgrammeStatus(this.programme, this.status.report)
      },
      nextActivityPerProgramme: formatList(nextActivityPerProgramme),
      outstandingVaccinations: filters.formatList(outstandingVaccinations)
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
    return `/programmes/${this.programme_id}/patients/${this.patient.nhsn}`
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
    if (context?.patientSessions?.[uuid]) {
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
      createdBy_uid: event.createdBy_uid,
      programme_ids: this.session.programme_ids
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
      name: event.name,
      note: gillick.note,
      createdAt: gillick.createdAt,
      createdBy_uid: event.createdBy_uid,
      programme_ids: this.session.programme_ids
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
      outcome: event.outcome,
      createdAt: event.createdAt,
      createdBy_uid: event.createdBy_uid,
      programme_ids: [this.programme_id]
    })
  }

  /**
   * Give PSD instruction
   *
   * @param {Instruction} instruction - Instruction
   */
  giveInstruction(instruction) {
    this.instruction_uuid = instruction.uuid

    this.patient.addEvent({
      type: EventType.Instruct,
      name: 'PSD instruction given',
      createdAt: instruction.createdAt,
      createdBy_uid: instruction.createdBy_uid,
      programme_ids: [this.programme_id]
    })
  }

  /**
   * Register attendance
   *
   * @param {import('./audit-event.js').AuditEvent} event - Event
   * @param {import('./session.js').RegistrationOutcome} register - Registration
   */
  registerAttendance(event, register) {
    this.session.updateRegister(this.patient.uuid, register)

    this.patient.addEvent({
      type: EventType.Register,
      name: this.status.register.description,
      createdAt: event.createdAt,
      createdBy_uid: event.createdBy_uid,
      programme_ids: this.session.programme_ids
    })
  }

  /**
   * Record pre-screening interview
   *
   * @param {import('./audit-event.js').AuditEvent} event - Event
   */
  preScreen(event) {
    this.patient.addEvent({
      type: EventType.Record,
      name: 'Completed pre-screening checks',
      note: event.note,
      createdBy_uid: event.createdBy_uid,
      programme_ids: this.session.programme_ids
    })
  }

  /**
   * Save session note
   *
   * @param {import('./audit-event.js').AuditEvent} event - Event
   */
  saveNote(event) {
    this.patient.addEvent({
      type: EventType.Unknown,
      name: 'Note',
      note: event.note,
      createdBy_uid: event.createdBy_uid,
      programme_ids: this.session.programme_ids
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
      createdBy_uid: event.createdBy_uid,
      programme_ids: this.session.programme_ids
    })
  }
}
