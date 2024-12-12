import { fakerEN_GB as faker } from '@faker-js/faker'

import {
  Reply,
  ReplyDecision,
  ReplyMethod,
  ReplyRefusal
} from '../models/reply.js'
import { getToday } from '../utils/date.js'
import { getHealthAnswers, getRefusalReason } from '../utils/reply.js'

import { generateParent } from './parent.js'

/**
 * Generate fake reply
 *
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {import('../models/session.js').Session} session - Session
 * @param {import('../models/patient.js').Patient} patient - Patient
 * @returns {Reply|undefined} - Reply
 */
export function generateReply(programme, session, patient) {
  const firstReply = Object.entries(patient.replies).length === 0
  const child = patient
  const parent = firstReply ? patient.parent1 : generateParent(patient.lastName)
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
        refusalReasonDetails: 'My child had the vaccination at our GP surgery.'
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
