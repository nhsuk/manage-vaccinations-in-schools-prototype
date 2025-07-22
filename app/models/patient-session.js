import { fakerEN_GB as faker } from '@faker-js/faker'
import filters from '@x-govuk/govuk-prototype-filters'

import {
  Activity,
  AuditEventType,
  ConsentOutcome,
  PatientOutcome,
  ReplyDecision,
  ScreenOutcome,
  TriageOutcome
} from '../enums.js'
import { getDateValueDifference, getYearGroup, today } from '../utils/date.js'
import {
  getInstructionOutcome,
  getInstructionStatus,
  getNextActivity,
  getRegistrationOutcome,
  getReportOutcome,
  getConsentStatus,
  getOutcomeStatus,
  getRecordOutcome,
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
  formatTag,
  formatVaccineMethod,
  formatYearGroup
} from '../utils/string.js'
import {
  getScreenOutcome,
  getScreenOutcomesForConsentMethod,
  getScreenVaccinationMethod,
  getTriageOutcome
} from '../utils/triage.js'

import { Gillick } from './gillick.js'
import { Instruction } from './instruction.js'
import { Patient } from './patient.js'
import { Programme } from './programme.js'
import { Session } from './session.js'

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
 * @property {Array<AuditEvent>} [notes] - Notes
 * @property {boolean} alternative - Administer alternative vaccine
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
    this.alternative = options?.alternative || false
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
   * Get year group, within context of patient session’s academic year
   *
   * @returns {number} - Year group in patient session’s academic year
   */
  get yearGroup() {
    return getYearGroup(this.patient.dob, this.session.academicYear)
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
      .filter(({ type }) => type === AuditEventType.Decision)
  }

  /**
   * Get pinned session notes
   *
   * @returns {Array<import('./audit-event.js').AuditEvent>} - Audit event
   */
  get pinnedNotes() {
    return this.auditEvents
      .filter(({ programme_ids }) => programme_ids.includes(this.programme_id))
      .filter(({ name }) => name === AuditEventType.Pinned)
      .sort((a, b) => getDateValueDifference(b.createdAt, a.createdAt))
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

  /**
   * Get screen outcomes for vaccination method(s) consented to
   *
   * @returns {Array<ScreenOutcome>} - Screen outcomes
   */
  get screenOutcomesForConsentMethod() {
    return getScreenOutcomesForConsentMethod(this.programme, this.responses)
  }

  /**
   * Get vaccination method(s) consented to use if safe to vaccinate
   *
   * @returns {import('../enums.js').ScreenVaccinationMethod|boolean} - Method
   */
  get screenVaccinationMethod() {
    return getScreenVaccinationMethod(this.programme, this.responses)
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
   * Get vaccine to administer (or was administered) in this patient session
   *
   * For all programmes besides flu, this will be an injection.
   * For the flu programme, this depends on consent responses
   *
   * @returns {import('./vaccine.js').Vaccine|undefined} - Vaccine method
   */
  get vaccine() {
    const standardVaccine = this.programme.vaccines.find((vaccine) => vaccine)
    const alternativeVaccine = this.programme.alternativeVaccine

    // Need consent response(s) before we can determine the chosen method
    // We only want to instruct on patients being vaccinated using nasal spray
    if (!this.consentGiven) {
      return
    }

    // If no alternative, can only have been the standard vaccine
    if (!this.programme.alternativeVaccine) {
      return standardVaccine
    }

    // Administered vaccine was the alternative
    if (this.alternative) {
      return alternativeVaccine
    }

    // Return vaccine based on consent (and triage) outcomes
    const hasScreenedForInjection =
      this.screen === ScreenOutcome.VaccinateInjection

    return this.hasConsentForInjectionOnly || hasScreenedForInjection
      ? alternativeVaccine // Injection
      : standardVaccine // Nasal
  }

  /**
   * Can either vaccine be administered
   *
   * @returns {boolean} - Either vaccine be administered
   */
  get canRecordAlternativeVaccine() {
    const hasScreenedForNasal = this.screen === ScreenOutcome.VaccinateNasal

    return (
      this.hasConsentForInjection &&
      !this.hasConsentForInjectionOnly &&
      !hasScreenedForNasal
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
    // Vaccination attempted, but not given
    if (this.lastRecordedVaccination) {
      return this.lastRecordedVaccination.outcome
      // Patient was screened, and could not be vaccinated
    } else if (this.screen && this.screen !== ScreenOutcome.Vaccinate) {
      return this.status.screen.reason
    }

    return this.status.consent.reason
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
   * Consent has been given
   *
   * @returns {boolean} - Consent has been given
   */
  get consentGiven() {
    return [
      ConsentOutcome.Given,
      ConsentOutcome.GivenForInjection,
      ConsentOutcome.GivenForNasalSpray
    ].includes(this.consent)
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
   * @returns {import('../enums.js').InstructionOutcome|boolean} - Instruction outcome
   */
  get instruct() {
    return getInstructionOutcome(this)
  }

  /**
   * Get registration outcome
   *
   * @returns {import('../enums.js').RegistrationOutcome} - Registration outcome
   */
  get register() {
    return getRegistrationOutcome(this)
  }

  /**
   * Get ready to record outcome
   *
   * @returns {import('../enums.js').Activity} - Ready to record outcome
   */
  get record() {
    return getRecordOutcome(this)
  }

  /**
   * Get last recorded vaccination
   *
   * @returns {import('./vaccination.js').Vaccination} - Vaccination
   */
  get lastRecordedVaccination() {
    if (this.vaccinations?.length > 0) {
      return this.vaccinations.at(-1)
    }
  }

  /**
   * Get vaccination (session) outcome
   *
   * @returns {import('../enums.js').VaccinationOutcome|PatientOutcome} - Vaccination (session) outcome
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
        ({ nextActivity, programme }) =>
          `${nextActivity} for ${programme.nameSentenceCase}`
      )

    const outstandingVaccinations = this.outstandingVaccinations.map(
      ({ programme }) => programme.name
    )

    let formattedYearGroup = formatYearGroup(this.yearGroup)
    formattedYearGroup += this.patient.registrationGroup
      ? `, ${this.patient.registrationGroup}`
      : ''
    formattedYearGroup += ` (${this.session.academicYear} academic year)`

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
        instruct: this.session.psdProtocol && formatTag(this.status.instruct),
        register: formatTag(this.status.register),
        outcome: formatProgrammeStatus(this.programme, this.status.outcome),
        report: formatProgrammeStatus(this.programme, this.status.report)
      },
      nextActivityPerProgramme: formatList(nextActivityPerProgramme),
      outstandingVaccinations: filters.formatList(outstandingVaccinations),
      vaccineMethod:
        this.vaccine?.method && formatVaccineMethod(this.vaccine.method),
      yearGroup: formattedYearGroup
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
      name: `Removed from the ${this.session.name.replace('Flu', 'flu')}`,
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
   * @param {import('../enums.js').RegistrationOutcome} register - Registration
   */
  registerAttendance(event, register) {
    this.session.updateRegister(this.patient.uuid, register)

    this.patient.addEvent({
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
      name: 'Completed pre-screening checks',
      note: event.note,
      createdBy_uid: event.createdBy_uid,
      programme_ids: this.session.programme_ids
    })
  }

  /**
   * Save note
   *
   * @param {import('./audit-event.js').AuditEvent} event - Event
   */
  saveNote(event) {
    this.patient.addEvent({
      name: event.name,
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
      type: AuditEventType.Reminder,
      name: `Reminder to give consent sent to ${parent.fullName}`,
      createdBy_uid: event.createdBy_uid,
      programme_ids: this.session.programme_ids
    })
  }
}
