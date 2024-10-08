import { fakerEN_GB as faker } from '@faker-js/faker'
import { getHealthAnswers, getRefusalReason } from '../utils/reply.js'
import { Child } from './child.js'
import { Parent } from './parent.js'
import { formatDate, getToday } from '../utils/date.js'
import {
  formatMarkdown,
  formatOther,
  stringToBoolean
} from '../utils/string.js'

export class ReplyDecision {
  static Given = 'Consent given'
  static Refused = 'Consent refused'
  static OnlyMenACWY = 'Consent given for MenACWY only'
  static Only3in1 = 'Consent given for 3-in-1 only'
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
 * @property {string} uuid - UUID
 * @property {string} created - Created date
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
 * @property {string} [note] - Note about this response
 * @property {string} patient_uuid - Patient UUID
 * @property {string} session_id - Session ID
 */
export class Reply {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.created = options?.created || getToday().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.child = options?.child && new Child(options.child)
    this.parent = options?.parent && new Parent(options.parent)
    this.decision = options?.decision
    this.confirmed = stringToBoolean(options?.confirmed)
    this.invalid = stringToBoolean(options?.invalid) || false
    this.method = options?.method
    this.healthAnswers = options?.healthAnswers
    this.refusalReason = options?.refusalReason
    this.refusalReasonOther = options?.refusalReasonOther
    this.refusalReasonDetails = options?.refusalReasonDetails
    this.note = options?.note || ''
    this.patient_uuid = options?.patient_uuid
    this.session_id = options?.session_id
  }

  /**
   * Generate fake reply
   * @param {import('./programme.js').Programme} programme - Programme
   * @param {import('./session.js').Session} session - Session
   * @param {import('./patient.js').Patient} patient - Patient
   * @returns {Reply|undefined} - Reply
   * @static
   */
  static generate(programme, session, patient) {
    const firstReply = Object.entries(patient.replies).length === 0
    const child = Child.generate(patient.record)
    const parent = firstReply
      ? patient.record.parent1
      : Parent.generate(patient.record.lastName)
    const decision = faker.helpers.weightedArrayElement([
      { value: ReplyDecision.Given, weight: 5 },
      { value: ReplyDecision.Refused, weight: 1 }
    ])
    const method = faker.helpers.weightedArrayElement([
      { value: ReplyMethod.Website, weight: 8 },
      { value: ReplyMethod.Phone, weight: 1 },
      { value: ReplyMethod.Paper, weight: 1 }
    ])

    const healthAnswers = getHealthAnswers(programme.vaccine)
    const refusalReason = getRefusalReason(programme.type)

    const today = getToday()
    const sessionClosedBeforeToday = session.close.valueOf() < today.valueOf()
    const sessionOpensAfterToday = session.open.valueOf() > today.valueOf()

    // If session hasn’t opened yet, don’t generate a reply
    if (sessionOpensAfterToday) {
      return
    }

    return new Reply({
      created: faker.date.between({
        from: session.open,
        to: sessionClosedBeforeToday ? session.close : today
      }),
      child,
      parent,
      decision,
      method,
      ...(decision === ReplyDecision.Given && { healthAnswers }),
      ...(decision === ReplyDecision.Refused && {
        refusalReason,
        ...(refusalReason === ReplyRefusal.AlreadyGiven && {
          refusalReasonDetails:
            'My child had the vaccination at our GP surgery.'
        }),
        ...(refusalReason === ReplyRefusal.GettingElsewhere && {
          refusalReasonDetails:
            'My child is getting the vaccination at our GP surgery.'
        }),
        ...(refusalReason === ReplyRefusal.Medical && {
          refusalReasonDetails:
            'My child has recently had chemotherapy and her immune system needs time to recover.'
        }),
        ...(refusalReason === ReplyRefusal.Other && {
          refusalReasonOther: 'My family rejects vaccinations on principle.'
        })
      }),
      patient_uuid: patient.uuid,
      session_id: session.id
    })
  }

  /**
   * Get respondent’s full name
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
   * @returns {string|undefined} - Relationship to child
   */
  get relationship() {
    if (this.parent?.relationship) {
      return this.parent.relationship
    } else if (this.child) {
      return 'Child (Gillick competent)'
    }
  }

  /**
   * Get formatted values
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
        dateStyle: 'long',
        timeStyle: 'short',
        hourCycle: 'h12'
      }),
      decision: decision(),
      refusalReason: formatOther(this.refusalReasonOther, this.refusalReason),
      refusalReasonDetails: formatMarkdown(this.refusalReasonDetails),
      note: formatMarkdown(this.note)
    }
  }

  /**
   * Get namespace
   * @returns {string} - Namespace
   */
  get ns() {
    return 'reply'
  }

  /**
   * Get URI
   * @returns {string} - URI
   */
  get uri() {
    return `/sessions/${this.session_id}/${this.child.nhsn}/replies/${this.uuid}`
  }
}
