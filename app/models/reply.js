import { fakerEN_GB as faker } from '@faker-js/faker'
import _ from 'lodash'

import { formatDate, today } from '../utils/date.js'
import {
  formatLinkWithSecondaryText,
  formatMarkdown,
  formatOther,
  formatParent,
  formatTag,
  formatTagWithSecondaryText,
  stringToBoolean
} from '../utils/string.js'

import { Child } from './child.js'
import { EmailStatus, Parent, SmsStatus } from './parent.js'
import { Patient } from './patient.js'
import { Programme, ProgrammeType } from './programme.js'
import { Session } from './session.js'
import { User } from './user.js'
import { VaccineMethod } from './vaccine.js'

/**
 * @readonly
 * @enum {string}
 */
export const ReplyDecision = {
  NoResponse: 'No response',
  Given: 'Consent given',
  OnlyFluInjection: 'Consent given for flu injection',
  OnlyMenACWY: 'Consent given for MenACWY only',
  OnlyTdIPV: 'Consent given for Td/IPV only',
  Declined: 'Follow up requested',
  Refused: 'Consent refused'
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
  OutsideSchool: 'Don’t want vaccination in school',
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
 * @property {boolean} [alternative] - Consent for alternative vaccine
 * @property {boolean} [confirmed] - Decision confirmed
 * @property {boolean} [consultation] - Consultation requested
 * @property {boolean} declined - Reply declines consent
 * @property {boolean} given - Reply gives consent
 * @property {boolean} invalid - Reply is invalid
 * @property {ReplyMethod} [method] - Reply method
 * @property {object} [healthAnswers] - Answers to health questions
 * @property {Array} [triageNote] - Triage note for answered health questions
 * @property {ReplyRefusal} [refusalReason] - Refusal reason
 * @property {string} [refusalReasonOther] - Other refusal reason
 * @property {string} [refusalReasonDetails] - Refusal reason details
 * @property {boolean} [selfConsent] - Reply given by child
 * @property {string} [note] - Note about this response
 * @property {string} patient_uuid - Patient UUID
 * @property {string} [programme_id] - Programme ID
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
    this.alternative =
      options?.alternative && stringToBoolean(options?.alternative)
    this.confirmed = stringToBoolean(options?.confirmed)
    this.consultation = stringToBoolean(options?.consultation)
    this.declined = this.decision === ReplyDecision.Declined
    this.given = [
      ReplyDecision.Given,
      ReplyDecision.OnlyFluInjection,
      ReplyDecision.OnlyMenACWY,
      ReplyDecision.OnlyTdIPV
    ].includes(this.decision)
    this.healthAnswers = this.given && options?.healthAnswers
    this.triageNote = this.given && options?.triageNote
    this.invalid =
      this?.decision === ReplyDecision.NoResponse
        ? false // Don’t show non response as invalid
        : stringToBoolean(options?.invalid) || false
    this.method = options?.method
    this.selfConsent = options?.selfConsent
    this.note = options?.note || ''
    this.patient_uuid = options?.patient_uuid
    this.programme_id = options?.programme_id
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
   * Has parent given consent for an injected vaccine?
   *
   * @returns {boolean} Consent given for an injected vaccine
   */
  get hasConsentForInjection() {
    return this.decision === ReplyDecision.OnlyFluInjection || this.alternative
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
      if (this.programme_id) {
        return Programme.read(this.programme_id, this.context)
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
   * Get status properties
   *
   * @returns {object} - Status properties
   */
  get status() {
    let colour
    let text = this.decision
    switch (this.decision) {
      case ReplyDecision.Given:
        colour = 'aqua-green'
        break
      case ReplyDecision.OnlyFluInjection:
        colour = 'aqua-green'
        text = ReplyDecision.Given
        break
      case ReplyDecision.Declined:
        colour = 'warm-yellow'
        break
      case ReplyDecision.Refused:
        colour = 'red'
        break
      case ReplyDecision.NoResponse:
        colour = 'grey'
        break
      default:
        colour = 'blue'
    }

    return {
      colour: this.invalid ? 'grey' : colour,
      html: this.invalid ? `<s>${text}</s>` : text
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    let decisionStatus = formatTag(this.status)
    if (this.invalid) {
      decisionStatus = formatTagWithSecondaryText(this.status, 'Invalid')
    } else if (this.confirmed) {
      decisionStatus = formatTagWithSecondaryText(this.status, 'Confirmed')
    } else if (this.programme.type === ProgrammeType.Flu) {
      if (this.decision === ReplyDecision.OnlyFluInjection) {
        decisionStatus = formatTagWithSecondaryText(
          this.status,
          VaccineMethod.Injection
        )
      } else if (this.decision === ReplyDecision.Given) {
        decisionStatus = formatTagWithSecondaryText(
          this.status,
          VaccineMethod.Nasal
        )
      }
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
      createdBy: this.createdBy?.fullName || '',
      decisionStatus,
      programme: this.programme?.nameTag,
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
    return {
      fullNameAndRelationship: this.selfConsent
        ? formatLinkWithSecondaryText(this.uri, this.relationship)
        : formatLinkWithSecondaryText(
            this.uri,
            formatParent(this.parent, false),
            this.parent?.tel
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
    return `/programmes/${this.programme_id}/patients/${this.patient.nhsn}/replies/${this.uuid}`
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

    // Delete original reply (with previous UUID)
    delete context.replies[this.uuid]

    // Update context
    const updatedReply = _.merge(this, updates)
    context.replies[updatedReply.uuid] = updatedReply
  }
}
