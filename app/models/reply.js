import { fakerEN_GB as faker } from '@faker-js/faker'
import _ from 'lodash'

import vaccines from '../datasets/vaccines.js'
import {
  NotifyEmailStatus,
  NotifySmsStatus,
  ProgrammeType,
  ReplyDecision,
  ReplyMethod,
  ReplyRefusal,
  VaccineMethod
} from '../enums.js'
import { formatDate, today } from '../utils/date.js'
import {
  formatMarkdown,
  formatOther,
  formatParent,
  formatTag,
  formatWithSecondaryText,
  stringToBoolean
} from '../utils/string.js'

import { Child } from './child.js'
import { Parent } from './parent.js'
import { Patient } from './patient.js'
import { Programme } from './programme.js'
import { Session } from './session.js'
import { User } from './user.js'

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
    this.method = options?.method
    this.selfConsent = options?.selfConsent
    this.note = options?.note || ''
    this.patient_uuid = options?.patient_uuid
    this.programme_id = options?.programme_id
    this.session_id = options?.session_id

    // Some values only valid if the consent request was received
    if (this.delivered) {
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
    }

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
   * @returns {string|undefined} Full name
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
   * @returns {boolean} Response was delivered
   */
  get delivered() {
    // Only invites to give consent online can have delivery failures
    if (this.method !== ReplyMethod.Website) {
      return true
    }

    const hasEmailGotEmail =
      this.parent?.email &&
      this.parent?.emailStatus === NotifyEmailStatus.Delivered
    const wantsSmsGotSms =
      this.parent?.sms === true &&
      this.parent?.smsStatus === NotifySmsStatus.Delivered

    return hasEmailGotEmail || wantsSmsGotSms
  }

  /**
   * Get respondent’s relationship to child
   *
   * @returns {string|undefined} Relationship to child
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
   * @returns {User} User
   */
  get createdBy() {
    try {
      if (this.createdBy_uid) {
        return User.findOne(this.createdBy_uid, this.context)
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
   * Get health questions to show based on programme and decision given
   *
   * @returns {Array} Health questions
   */
  get healthQuestionsForDecision() {
    const { Flu, HPV, MenACWY, TdIPV } = ProgrammeType
    const { Injection, Nasal } = VaccineMethod
    const programme = this.session.primaryProgrammes[0]

    const healthQuestionsForDecision = new Map()
    let consentedMethod
    let consentedVaccine

    // Consent given for flu programme with method of vaccination
    if (programme.type === Flu) {
      consentedVaccine = Object.values(vaccines).filter(
        (programme) => programme.type === Flu
      )

      // If no consent for alternative injection or only consent for injection
      if (!this.alternative) {
        consentedMethod =
          this.decision === ReplyDecision.OnlyFluInjection ? Injection : Nasal
        consentedVaccine = Object.values(vaccines).find(
          (programme) => programme.method === consentedMethod
        )
      }
    }

    // Consent given for HPV programme
    if (programme.type === HPV) {
      consentedVaccine = Object.values(vaccines).find(
        (programme) => programme.type === HPV
      )
    }

    // Consent given for MenACWY programme only
    if (this.decision === ReplyDecision.OnlyMenACWY) {
      consentedVaccine = Object.values(vaccines).find(
        (programme) => programme.type === MenACWY
      )
    }

    // Consent given for Td/IPV programme only
    if (this.decision === ReplyDecision.OnlyTdIPV) {
      consentedVaccine = Object.values(vaccines).find(
        (programme) => programme.type === TdIPV
      )
    }

    // Consent given for all programmes
    if (ReplyDecision.Given && !consentedVaccine) {
      consentedVaccine = this.session.vaccines
    }

    const consentedVaccines = Array.isArray(consentedVaccine)
      ? consentedVaccine
      : [consentedVaccine]
    for (const vaccine of consentedVaccines) {
      for (const [key, value] of Object.entries(vaccine.healthQuestions)) {
        healthQuestionsForDecision.set(key, value)
      }
    }

    // Always ask support question last
    healthQuestionsForDecision.set('support', {})

    return Object.fromEntries(healthQuestionsForDecision)
  }

  /**
   * Get patient
   *
   * @returns {Patient} Patient
   */
  get patient() {
    try {
      if (this.patient_uuid) {
        return Patient.findOne(this.patient_uuid, this.context)
      }
    } catch (error) {
      console.error('Reply.patient', error.message)
    }
  }
  /**
   * Get programme
   *
   * @returns {Programme} User
   */
  get programme() {
    try {
      if (this.programme_id) {
        return Programme.findOne(this.programme_id, this.context)
      }
    } catch (error) {
      console.error('Upload.programme', error.message)
    }
  }

  /**
   * Get session
   *
   * @returns {Session} Session
   */
  get session() {
    try {
      if (this.session_id) {
        return Session.findOne(this.session_id, this.context)
      }
    } catch (error) {
      console.error('Reply.session', error.message)
    }
  }

  /**
   * Get status properties
   *
   * @returns {object} Status properties
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
   * @returns {object} Formatted values
   */
  get formatted() {
    let decisionStatus = formatTag(this.status)
    if (!this.delivered) {
      decisionStatus = formatTag({
        text: 'Request failed',
        colour: 'dark-orange'
      })
    } else if (this.invalid) {
      decisionStatus = formatWithSecondaryText(
        formatTag(this.status),
        'Invalid',
        false
      )
    } else if (this.confirmed) {
      decisionStatus = formatWithSecondaryText(
        formatTag(this.status),
        'Confirmed',
        false
      )
    } else if (this.programme?.alternativeVaccine) {
      const vaccineMethod =
        this.decision === ReplyDecision.OnlyFluInjection
          ? VaccineMethod.Injection
          : VaccineMethod.Nasal

      decisionStatus = formatWithSecondaryText(
        formatTag(this.status),
        vaccineMethod,
        false
      )
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
      fullNameAndRelationship: this.selfConsent
        ? this.relationship
        : formatParent(this.parent, false),
      parent: formatParent(this.parent, true),
      tel: this.parent.tel,
      email: this.parent.email,
      programme: this.programme?.nameTag,
      refusalReason: formatOther(this.refusalReasonOther, this.refusalReason),
      refusalReasonDetails: formatMarkdown(this.refusalReasonDetails),
      note: formatMarkdown(this.note)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} Namespace
   */
  get ns() {
    return 'reply'
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/programmes/${this.programme_id}/patients/${this.patient.nhsn}/replies/${this.uuid}`
  }

  /**
   * Get parent form URI
   *
   * @returns {string} Parent form URI
   */
  get parentUri() {
    return `${this.session.consentUrl}/${this.uuid}`
  }

  /**
   * Find all
   *
   * @param {object} context - Context
   * @returns {Array<Reply>|undefined} Replies
   * @static
   */
  static findAll(context) {
    return Object.values(context.replies)
      .map((reply) => new Reply(reply, context))
      .filter((reply) => !reply.patient_uuid)
  }

  /**
   * Find one
   *
   * @param {string} uuid - Reply UUID
   * @param {object} context - Context
   * @returns {Reply|undefined} Reply
   * @static
   */
  static findOne(uuid, context) {
    if (context?.replies?.[uuid]) {
      return new Reply(context.replies[uuid], context)
    }
  }

  /**
   * Create
   *
   * @param {object} reply - Consent
   * @param {object} context - Context
   * @returns {Reply} Created reply
   * @static
   */
  static create(reply, context) {
    const createdReply = new Reply(reply)

    // Update context
    context.replies = context.replies || {}
    context.replies[createdReply.uuid] = createdReply

    return createdReply
  }

  /**
   * Update
   *
   * @param {string} uuid - Reply UUID
   * @param {object} updates - Updates
   * @param {object} context - Context
   * @returns {Reply} Updated reply
   * @static
   */
  static update(uuid, updates, context) {
    const updatedReply = _.merge(Reply.findOne(uuid, context), updates)
    updatedReply.updatedAt = today()

    // Remove reply context
    delete updatedReply.context

    // Delete original reply (with previous UUID)
    delete context.replies[uuid]

    // Update context
    context.replies[updatedReply.uuid] = updatedReply

    return updatedReply
  }
}
