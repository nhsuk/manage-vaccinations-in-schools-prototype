import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatDate, getToday } from '../utils/date.js'
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
 * @property {Date} created - Created date
 * @property {string} [created_user_uid] - User who created reply
 * @property {import('./child.js').Child} [child] - Child
 * @property {import('./parent.js').Parent} [parent] - Parent or guardian
 * @property {ReplyDecision} [decision] - Consent decision
 * @property {boolean} [confirmed] - Decision confirmed
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
    this.created = options?.created ? new Date(options.created) : getToday()
    this.created_user_uid = options?.created_user_uid
    this.child = options?.child && new Child(options.child)
    this.parent = options?.parent && new Parent(options.parent)
    this.decision = options?.decision
    this.confirmed = stringToBoolean(options?.confirmed)
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
  get created_user() {
    try {
      const user = this.context?.users[this.created_user_uid]
      if (user) {
        return new User(user)
      }
    } catch (error) {
      console.error('Reply.created_user', error.message)
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
        return new Patient(patient)
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
        return new Session(session)
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
      created: formatDate(this.created, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      created_user: this.created_user?.fullName || '',
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
    return `/sessions/${this.session_id}/${this.child.nhsn}/replies/${this.uuid}`
  }
}
