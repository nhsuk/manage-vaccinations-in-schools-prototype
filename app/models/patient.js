import { fakerEN_GB as faker } from '@faker-js/faker'
import _ from 'lodash'

import { EventType, NoticeType } from '../enums.js'
import { getDateValueDifference, removeDays, today } from '../utils/date.js'
import { tokenize } from '../utils/object.js'
import { getPreferredNames } from '../utils/reply.js'
import {
  formatLink,
  formatLinkWithSecondaryText,
  formatParent,
  sentenceCaseProgrammeName
} from '../utils/string.js'

import { AuditEvent } from './audit-event.js'
import { Cohort } from './cohort.js'
import { Parent } from './parent.js'
import { PatientSession } from './patient-session.js'
import { Record } from './record.js'
import { Reply } from './reply.js'

/**
 * @class Patient in-session record
 * @augments Record
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {string} uuid - UUID
 * @property {Date} [updatedAt] - Updated date
 * @property {Array<import('./audit-event.js').AuditEvent>} events - Events
 * @property {Array<string>} [cohort_uids] - Cohort UIDs
 * @property {Array<string>} [reply_uuids] - Reply IDs
 * @property {Array<string>} [patientSession_uuids] - Patient session IDs
 */
export class Patient extends Record {
  constructor(options, context) {
    super(options, context)

    this.uuid = options?.uuid || faker.string.uuid()
    this.updatedAt = options?.updatedAt && new Date(options.updatedAt)
    this.events = options?.events || []
    this.cohort_uids = options?.cohort_uids || []
    this.reply_uuids = options?.reply_uuids || []
    this.patientSession_uuids = options?.patientSession_uuids || []
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
      if (parent && !parents.has(parent.uuid)) {
        parents.set(parent.uuid, new Parent(parent))
      }
    })

    return [...parents.values()]
  }

  /**
   * Get audit events
   *
   * @returns {Array<AuditEvent>} - Audit events
   */
  get auditEvents() {
    return this.events.map(
      (auditEvent) => new AuditEvent(auditEvent, this.context)
    )
  }

  /**
   * Get audit events grouped by date
   *
   * @returns {object} - Audit events grouped by date
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
   * Get reminders sent
   *
   * @returns {Array} - Reminders sent
   */
  get reminders() {
    return this.events
      .map((event) => new AuditEvent(event))
      .filter((event) => event.type === EventType.Remind)
  }

  /**
   * Get date last reminders sent
   *
   * @returns {string|undefined} - Date last reminders sent
   */
  get lastReminderDate() {
    const lastReminder = this.reminders.at(-1)
    if (lastReminder) {
      return lastReminder.formatted.createdAt
    }
  }

  /**
   * Get all notices
   *
   * @returns {Array<AuditEvent>} - Notice events
   */
  get notices() {
    return this.events
      .map((event) => new AuditEvent(event))
      .filter((event) => event.type === EventType.Notice)
  }

  /**
   * Get most recent notice
   *
   * @returns {AuditEvent} - Notice event
   */
  get notice() {
    return this.notices && this.notices[0]
  }

  /**
   * Get cohorts
   *
   * @returns {Array<Cohort>} - Cohorts
   */
  get cohorts() {
    if (this.context?.cohorts && this.cohort_uids) {
      return this.cohort_uids.map((uid) => Cohort.read(uid, this.context))
    }

    return []
  }

  /**
   * Get replies
   *
   * @returns {Array<Reply>} - Replies
   */
  get replies() {
    return this.reply_uuids
      .map((uuid) => Reply.read(uuid, this.context))
      .filter((reply) => reply?.patient_uuid === this.uuid)
  }

  /**
   * Get patient sessions
   *
   * @returns {Array<PatientSession>} - Patient sessions
   */
  get patientSessions() {
    if (this.context?.patientSessions && this.patientSession_uuids) {
      return this.patientSession_uuids
        .map((uuid) => PatientSession.read(uuid, this.context))
        .sort((a, b) => getDateValueDifference(b.createdAt, a.createdAt))
    }

    return []
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      fullName: formatLink(this.uri, this.fullName),
      fullNameAndNhsn: formatLinkWithSecondaryText(
        this.uri,
        this.fullName,
        this.formatted.nhsn || 'Missing NHS number'
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
      dob: `${this.formatted.dob}</br>
          <span class="nhsuk-u-secondary-text-color nhsuk-u-font-size-16">
            ${this.formatted.yearGroup}
          </span>`
    }
  }

  /**
   * Get tokenised values (to use in search queries)
   *
   * @returns {string} - Tokens
   */
  get tokenized() {
    const parentTokens = []
    for (const parent of this.parents) {
      parentTokens.push(tokenize(parent, ['fullName', 'tel', 'email']))
    }

    const childTokens = tokenize(this, [
      'nhsn',
      'fullName',
      'postalCode',
      'school.name'
    ])

    return [childTokens, parentTokens].join(' ')
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      ...super.formatted,
      lastReminderDate: this.lastReminderDate
        ? `Last reminder sent on ${this.lastReminderDate}`
        : 'No reminders sent'
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
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Patient>|undefined} Patients
   * @static
   */
  static readAll(context) {
    return Object.values(context.patients).map(
      (patient) => new Patient(patient, context)
    )
  }

  /**
   * Read
   *
   * @param {string} nhsn - Patient NHS number
   * @param {object} context - Context
   * @returns {Patient|undefined} Patient
   * @static
   */
  static read(nhsn, context) {
    if (context?.patients) {
      return this.readAll(context).find((patient) => patient.nhsn === nhsn)
    }
  }

  /**
   * Create
   *
   * @param {Patient} patient - Patient
   * @param {object} context - Context
   */
  create(patient, context) {
    patient = new Patient(patient)

    // Update context
    context.patients = context.patients || {}
    context.patients[patient.uuid] = patient
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

    // Delete original patient (with previous UUID)
    delete context.patients[this.uuid]

    // Update context
    const updatedPatient = _.merge(this, updates)
    context.patients[updatedPatient.uuid] = updatedPatient
  }

  /**
   * Delete
   *
   * @param {object} context - Context
   */
  delete(context) {
    delete context.patients[this.uuid]
  }

  /**
   * Add event to activity log
   *
   * @param {object} event - Event
   */
  addEvent(event) {
    this.events.push(new AuditEvent(event))
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
      name: `Selected for the ${cohort.name.sentenceCase}`,
      createdAt: cohort.createdAt,
      createdBy_uid: cohort.createdBy_uid,
      programme_ids: [cohort.programme_id]
    })
  }

  /**
   * Unselect patient from cohort
   *
   * @param {import('./cohort.js').Cohort} cohort - Cohort
   * @param {object} context - Context
   */
  unselectFromCohort(cohort, context) {
    this.cohort_uids = this.cohort_uids.filter((uid) => uid !== cohort.uid)
    this.update({}, context)

    this.addEvent({
      type: EventType.Select,
      name: `Removed from the ${cohort.name.sentenceCase}`,
      createdBy_uid: cohort.createdBy_uid,
      programme_ids: [cohort.programme_id]
    })
  }

  /**
   * Add patient to session
   *
   * @param {import('./patient-session.js').PatientSession} patientSession - Patient session
   */
  addToSession(patientSession) {
    this.patientSession_uuids.push(patientSession.uuid)
  }

  /**
   * Invite parent to give consent
   *
   * @param {import('./patient-session.js').PatientSession} patientSession - Patient session
   */
  inviteToSession(patientSession) {
    this.addEvent({
      type: EventType.Invite,
      name: `Invited to the ${sentenceCaseProgrammeName(patientSession.session.name)}`,
      createdAt: patientSession.session.openAt,
      createdBy_uid: patientSession.createdBy_uid,
      programme_ids: patientSession.session.programme_ids
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
    const isNew = !this.replies[uuid]
    const parent = new Parent({ fullName, relationship })
    const formattedParent = formatParent(parent, false)

    let name = `${decision} by ${formattedParent}`
    if (invalid) {
      name = `${decision} by ${formattedParent} marked as invalid`
    } else if (isNew) {
      name = `${decision} in response from ${formattedParent}`
    } else {
      name = `${decision} in updated response from ${formattedParent}`
    }

    this.reply_uuids.push(reply.uuid)
    this.addEvent({
      type: EventType.Consent,
      name,
      createdAt: isNew ? reply.createdAt : today(),
      createdBy_uid: reply.createdBy_uid,
      programme_ids: [reply.programme_id]
    })
  }

  /**
   * Record vaccination
   *
   * @param {import('./vaccination.js').Vaccination} vaccination - Vaccination
   */
  recordVaccination(vaccination) {
    this.vaccination_uuids.push(vaccination.uuid)

    let name
    if (vaccination.given) {
      name = vaccination.updatedAt
        ? `Vaccination record for ${vaccination.formatted.vaccine_snomed} updated`
        : `Vaccinated with ${vaccination.formatted.vaccine_snomed}`
    } else {
      name = `Unable to vaccinate: ${vaccination.outcome}`
    }

    this.addEvent({
      type: EventType.Record,
      name,
      note: vaccination.note,
      createdAt: vaccination.updatedAt || vaccination.createdAt,
      createdBy_uid: vaccination.createdBy_uid,
      programme_ids: [vaccination.programme_id]
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
        this.dod = removeDays(today(), 5)
        name = `Record updated with child’s date of death`
        break
      case NoticeType.Hidden:
        // Notify request to not share vaccination with GP
        name = `Request for vaccination not to be shared with GP`
        break
      case NoticeType.Invalid:
        // Flag record as invalid
        this.invalid = true
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
      createdAt: notice.createdAt
    })
  }
}
