import { fakerEN_GB as faker } from '@faker-js/faker'

import { getHealthAnswers, getRefusalReason } from '../utils/reply.js'

import { Child } from './child.js'
import { Parent } from './parent.js'
import { Reply, ReplyDecision, ReplyMethod, ReplyRefusal } from './reply.js'

/**
 * @class Consent
 * @augments Reply
 */
export class Consent extends Reply {
  /**
   * Generate fake consent
   *
   * @param {import('./programme.js').Programme} programme - Programme
   * @param {import('./session.js').Session} session - Session
   * @param {import('./patient.js').Patient} patient - Patient
   * @returns {Consent} - Consent
   * @static
   */
  static generate(programme, session, patient) {
    const child = Child.generate()
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
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'consent'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/consents/${this.uuid}`
  }
}
