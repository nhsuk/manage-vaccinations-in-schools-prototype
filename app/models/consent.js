import { fakerEN_GB as faker } from '@faker-js/faker'
import { formatDate, getToday } from '../utils/date.js'
import { formatMarkdown, formatOther } from '../utils/string.js'
import { getHealthAnswers, getRefusalReason } from '../utils/reply.js'
import { Child } from './child.js'
import { Parent } from './parent.js'
import { ReplyDecision, ReplyMethod, ReplyRefusal } from './reply.js'

/**
 * @class Consent
 * @property {string} uuid - UUID
 * @property {string} created - Created date
 * @property {import('./child.js').Child} child - Child
 * @property {import('./parent.js').Parent} parent - Parent or guardian
 * @property {ReplyDecision} decision - Consent decision
 * @property {boolean} given - Consent given
 * @property {ReplyMethod} [method] - Reply method
 * @property {object} [healthAnswers] - Answers to health questions
 * @property {ReplyRefusal} [refusalReason] - Refusal reason
 * @property {string} [refusalReasonOther] - Other refusal reason
 * @property {string} [refusalReasonDetails] - Refusal reason details
 * @property {string} [patient_uuid] - Patient UUID
 * @property {string} session_id - Session ID
 */
export class Consent {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.created = options?.created || getToday().toISOString()
    this.child = options?.child && new Child(options.child)
    this.parent = options?.parent && new Parent(options.parent)
    this.decision = options?.decision || ''
    this.given = this.decision === ReplyDecision.Given
    this.method = options?.method || ReplyMethod.Website
    this.healthAnswers = options?.healthAnswers
    this.refusalReason = !this.given ? options?.refusalReason || '' : undefined
    this.refusalReasonOther =
      this.refusalReason === ReplyRefusal.Other
        ? options?.refusalReasonOther || ''
        : undefined
    this.refusalReasonDetails =
      !this.given && this.refusalReason !== ReplyRefusal.Personal
        ? options?.refusalReasonDetails || ''
        : undefined
    this.patient_uuid = options?.patient_uuid
    this.session_id = options.session_id
  }

  /**
   * Generate fake consent
   * @param {import('./programme.js').Programme} programme - Programme
   * @param {import('./session.js').Session} session - Session
   * @param {import('./patient.js').Patient} patient - Patient
   * @returns {Consent} - Consent
   * @static
   */
  static generate(programme, session, patient) {
    const child = Child.generate(patient)
    const parent = Parent.generate(patient.record.lastName)
    const decision = faker.helpers.weightedArrayElement([
      { value: ReplyDecision.Given, weight: 3 },
      { value: ReplyDecision.Refused, weight: 1 }
    ])
    const method = faker.helpers.weightedArrayElement([
      { value: ReplyMethod.Website, weight: 5 },
      { value: ReplyMethod.Phone, weight: 1 },
      { value: ReplyMethod.Paper, weight: 1 }
    ])

    const healthAnswers = getHealthAnswers(programme.vaccine)
    const refusalReason = getRefusalReason(programme.type)

    return new Consent({
      created: faker.date.between({
        from: session.open,
        to: session.close
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
      session_id: session.id
    })
  }

  /**
   * Get formatted values
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      created: formatDate(this.created, {
        dateStyle: 'long',
        timeStyle: 'short',
        hourCycle: 'h12'
      }),
      refusalReason: formatOther(this.refusalReasonOther, this.refusalReason),
      refusalReasonDetails: formatMarkdown(this.refusalReasonDetails)
    }
  }

  /**
   * Get namespace
   * @returns {string} - Namespace
   */
  get ns() {
    return 'consent'
  }

  /**
   * Get URI
   * @returns {string} - URI
   */
  get uri() {
    return `/consents/${this.session_id}/${this.uuid}`
  }
}
