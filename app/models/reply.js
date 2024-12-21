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
import { Parent } from './parent.js'
import { Patient } from './patient.js'
import { Session } from './session.js'
import { User } from './user.js'

export class ReplyDecision {
  static Given = 'Consent given'
  static Refused = 'Consent refused'
  static OnlyMenACWY = 'Consent given for MenACWY only'
  static Only3in1 = 'Consent given for 3-in-1 only'
  static NoResponse = 'No response'
}

export class ReplyMethod {
  static Website = 'Online'
  static Phone = 'By phone'
  static Paper = 'Paper form'
  static InPerson = 'In person'
}

export class ReplyRefusal {
  static Gelatine = 'Vaccine contains gelatine'
  static AlreadyGiven = 'Vaccine already received'
  static GettingElsewhere = 'Vaccine will be given elsewhere'
  static Medical = 'Medical reasons'
  static Personal = 'Personal choice'
  static Other = 'Other'
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
    this.given =
      this.decision !== ReplyDecision.Refused ||
      this.decision !== ReplyDecision.NoResponse
    this.invalid =
      this?.decision === ReplyDecision.NoResponse
        ? false // Don’t show non response as invalid
        : stringToBoolean(options?.invalid) || false
    this.method = options?.method
    this.healthAnswers = options?.healthAnswers
    this.refusalReason = options?.refusalReason
    this.refusalReasonOther = options?.refusalReasonOther
    this.refusalReasonDetails = options?.refusalReasonDetails
    this.selfConsent = options?.selfConsent
    this.note = options?.note || ''
    this.patient_uuid = options?.patient_uuid
    this.session_id = options?.session_id
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
   * Get respondent’s relationship to child
   *
   * @returns {string|undefined} - Relationship to child
   */
  get relationship() {
    if (this.parent) {
      return this.parent.relationship || ''
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
      const user = this.context?.users[this.createdBy_uid]
      if (user) {
        return new User(user)
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
   * Get session
   *
   * @returns {Session} - Session
   */
  get session() {
    try {
      const session = this.context?.sessions[this.session_id]
      if (session) {
        return new Session(session, this.context)
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
      createdBy: this.createdBy?.fullName || '',
      decision: decision(),
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
    return `/sessions/${this.session_id}/${this.patient.nhsn}/replies/${this.uuid}`
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
