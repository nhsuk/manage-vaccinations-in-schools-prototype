import { fakerEN_GB as faker } from '@faker-js/faker'
import _ from 'lodash'

import { formatDate, today } from '../utils/date.js'
import {
  formatLinkWithSecondaryText,
  formatMarkdown,
  formatOther,
  stringToBoolean
} from '../utils/string.js'

import { Child } from './child.js'
import { EmailStatus, Parent, SmsStatus } from './parent.js'
import { Patient } from './patient.js'
import { Programme } from './programme.js'
import { Session } from './session.js'
import { User } from './user.js'

/**
 * @readonly
 * @enum {string}
 */
export const ReplyDecision = {
  Given: 'Consent given',
  Refused: 'Consent refused',
  OnlyMenACWY: 'Consent given for MenACWY only',
  OnlyTdIPV: 'Consent given for Td/IPV only',
  NoResponse: 'No response'
}

/**
 * @readonly
 * @enum {string}
 */
export const ReplyMethod = {
  Website: 'Online',
  Phone: 'By phone',
  Paper: 'Paper form',
  InPerson: 'In person'
}

/**
 * @readonly
 * @enum {string}
 */
export const ReplyRefusal = {
  Gelatine: 'Vaccine contains gelatine',
  AlreadyGiven: 'Vaccine already received',
  GettingElsewhere: 'Vaccine will be given elsewhere',
  Medical: 'Medical reasons',
  Personal: 'Personal choice',
  Other: 'Other'
}

/**
 * @class Reply
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} uuid - UUID
 * @property {Date} [createdAt] - Created date
 * @property {string} [createdBy_uid] - User who created reply
 * @property {Date} [updatedAt] - Updated date
 * @property {import('./child.js').Child} [child] - Child
 * @property {import('./parent.js').Parent} [parent] - Parent or guardian
 * @property {ReplyDecision} [decision] - Consent decision
 * @property {boolean} [confirmed] - Decision confirmed
 * @property {boolean} given - Reply gives consent
 * @property {boolean} invalid - Reply is invalid
 * @property {ReplyMethod} [method] - Reply method
 * @property {object} [healthAnswers] - Answers to health questions
 * @property {ReplyRefusal} [refusalReason] - Refusal reason
 * @property {string} [refusalReasonOther] - Other refusal reason
 * @property {string} [refusalReasonDetails] - Refusal reason details
 * @property {boolean} [selfConsent] - Reply given by child
 * @property {string} [note] - Note about this response
 * @property {string} patient_uuid - Patient UUID
 * @property {string} [programme_pid] - Programme ID
 * @property {string} session_id - Session ID
 */
export class Reply {
  constructor(options, context) {
    this.context = context
    this.uuid = options?.uuid || faker.string.uuid()
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdBy_uid = options?.createdBy_uid
    this.updatedAt = options?.updatedAt && new Date(options.updatedAt)
    this.child = options?.child && new Child(options.child)
    this.parent = options?.parent && new Parent(options.parent)
    this.decision = options?.decision
    this.confirmed = stringToBoolean(options?.confirmed)
    this.given = [
      ReplyDecision.Given,
      ReplyDecision.OnlyMenACWY,
      ReplyDecision.OnlyTdIPV
    ].includes(this.decision)
    this.healthAnswers = this.given && options?.healthAnswers
    this.invalid =
      this?.decision === ReplyDecision.NoResponse
        ? false // Don’t show non response as invalid
        : stringToBoolean(options?.invalid) || false
    this.method = options?.method
    this.selfConsent = options?.selfConsent
    this.note = options?.note || ''
    this.patient_uuid = options?.patient_uuid
    this.programme_pid = options?.programme_pid
    this.session_id = options?.session_id

    if (
      [
        ReplyDecision.Refused,
        ReplyDecision.OnlyMenACWY,
        ReplyDecision.OnlyTdIPV
      ].includes(this.decision)
    ) {
      this.refusalReason = options?.refusalReason || ''

      if (this.refusalReason === ReplyRefusal.Other) {
        this.refusalReasonOther = options?.refusalReasonOther
      }

      if (
        ![ReplyRefusal.Personal, ReplyRefusal.Other].includes(
          this.refusalReason
        )
      ) {
        this.refusalReasonDetails = options?.refusalReasonDetails || ''
      }
    }
  }

  /**
   * Get respondent’s full name
   *
   * @returns {string|undefined} - Full name
   */
  get fullName() {
    if (this.parent) {
      return this.parent.fullName
    } else if (this.child) {
      return this.child.fullName
    }
  }

  /**
   * Was the consent response delivered?
   *
   * @returns {boolean} - Response was delivered
   */
  get delivered() {
    // Only invites to give consent online can have delivery failures
    if (this.method !== ReplyMethod.Website) {
      return true
    }

    const hasEmailGotEmail =
      this.parent?.email && this.parent?.emailStatus === EmailStatus.Delivered
    const wantsSmsGotSms =
      this.parent?.sms === true &&
      this.parent?.smsStatus === SmsStatus.Delivered

    return hasEmailGotEmail || wantsSmsGotSms
  }

  /**
   * Get respondent’s relationship to child
   *
   * @returns {string|undefined} - Relationship to child
   */
  get relationship() {
    if (this.parent) {
      return this.parent.relationship
    } else if (this.child) {
      return 'Child (Gillick competent)'
    }
  }

  /**
   * Get health answers for consented vaccinations
   *
   * @todo Shows correct health answers on parental consent journey.
   * This shouldn’t really exist; if a parent were to change their decision,
   * they should be asked any outstanding questions. The current flow doesn’t
   * support complex branching when questions are edited.
   * @returns {object|undefined} - Health answers for consented vaccinations
   */
  get healthAnswersForDecision() {
    let healthAnswers = this.healthAnswers

    if (this.decision === ReplyDecision.OnlyMenACWY) {
      healthAnswers = Object.fromEntries(
        Object.entries(this.healthAnswers).map(([key, value]) => [
          key === 'RecentTdIpvVaccination' ? 'RecentMenAcwyVaccination' : key,
          value
        ])
      )
    } else if (this.decision === ReplyDecision.OnlyTdIPV) {
      healthAnswers = Object.fromEntries(
        Object.entries(this.healthAnswers).map(([key, value]) => [
          key === 'RecentMenAcwyVaccination' ? 'RecentTdIpvVaccination' : key,
          value
        ])
      )
    }

    return healthAnswers
  }

  /**
   * Get user who created reply
   *
   * @returns {User} - User
   */
  get createdBy() {
    try {
      if (this.createdBy_uid) {
        return User.read(this.createdBy_uid, this.context)
      }
    } catch (error) {
      console.error('Reply.createdBy', error.message)
    }
  }

  /**
   * Get patient
   *
   * @returns {Patient} - Patient
   */
  get patient() {
    try {
      const patient = this.context?.patients[this.patient_uuid]
      if (patient) {
        return new Patient(patient, this.context)
      }
    } catch (error) {
      console.error('Reply.patient', error.message)
    }
  }

  /**
   * Get programme
   *
   * @returns {Programme} - User
   */
  get programme() {
    try {
      if (this.programme_pid) {
        return Programme.read(this.programme_pid, this.context)
      }
    } catch (error) {
      console.error('Upload.programme', error.message)
    }
  }

  /**
   * Get session
   *
   * @returns {Session} - Session
   */
  get session() {
    try {
      if (this.session_id) {
        return Session.read(this.session_id, this.context)
      }
    } catch (error) {
      console.error('Reply.session', error.message)
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    const decision = () => {
      if (this.invalid) {
        return `<s>${this.decision}</s><br>Invalid`
      } else if (this.confirmed) {
        return `${this.decision}<br><b>Confirmed</b>`
      }

      return this.decision
    }

    return {
      createdAt: formatDate(this.createdAt, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      createdAt_date: formatDate(this.createdAt, {
        dateStyle: 'long'
      }),
      createdBy: this.createdBy?.fullName || '',
      decision: decision(),
      programme: this.programme?.name,
      refusalReason: formatOther(this.refusalReasonOther, this.refusalReason),
      refusalReasonDetails: formatMarkdown(this.refusalReasonDetails),
      note: formatMarkdown(this.note)
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    const fullName = this.fullName || 'Name unknown'

    return {
      fullNameAndRelationship: formatLinkWithSecondaryText(
        this.uri,
        fullName,
        this.relationship
      )
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'reply'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/sessions/${this.session_id}/patients/${this.patient.nhsn}/replies/${this.uuid}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Reply>|undefined} Replies
   * @static
   */
  static readAll(context) {
    return Object.values(context.replies)
      .map((reply) => new Reply(reply, context))
      .filter((reply) => !reply.patient_uuid)
  }

  /**
   * Read
   *
   * @param {string} uuid - Reply UUID
   * @param {object} context - Context
   * @returns {Reply|undefined} Reply
   * @static
   */
  static read(uuid, context) {
    if (context?.replies) {
      return new Reply(context.replies[uuid], context)
    }
  }

  /**
   * Create
   *
   * @param {Reply} reply - Consent
   * @param {object} context - Context
   */
  create(reply, context) {
    reply = new Reply(reply)

    // Update context
    context.replies = context.replies || {}
    context.replies[reply.uuid] = reply
  }

  /**
   * Update
   *
   * @param {object} updates - Updates
   * @param {object} context - Context
   */
  update(updates, context) {
    this.updatedAt = new Date()

    // Remove reply context
    delete this.context

    // Delete original download (with previous ID)
    delete context.replies[this.uuid]

    // Update context
    const updatedReply = _.merge(this, updates)
    context.replies[updatedReply.uuid] = updatedReply
  }
}
