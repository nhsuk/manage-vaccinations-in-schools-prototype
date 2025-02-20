import { fakerEN_GB as faker } from '@faker-js/faker'

import healthConditions from '../datasets/health-conditions.js'
import { Consent } from '../models/consent.js'
import { ReplyDecision, ReplyMethod, ReplyRefusal } from '../models/reply.js'
import { today } from '../utils/date.js'
import {
  getHealthAnswers,
  getRefusalReason,
  getTriageNote
} from '../utils/reply.js'

import { generateParent } from './parent.js'

/**
 * Generate fake consent
 *
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {import('../models/session.js').Session} session - Session
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @param {number} index - Reply
 * @param {Date} [lastConsentCreatedAt] - Date previous consent response created
 * @returns {Consent|undefined} - Consent
 */
export function generateConsent(
  programme,
  session,
  patientSession,
  index,
  lastConsentCreatedAt
) {
  // Child
  const child = patientSession.patient

  // Parent
  let parent
  if (index === 0) {
    parent = patientSession.patient.parent1
  } else if (index === 1 && patientSession.patient?.parent2) {
    parent = patientSession.patient.parent2
  } else {
    parent = generateParent(patientSession.patient.lastName)
  }

  // Decision
  const decision = faker.helpers.weightedArrayElement([
    { value: ReplyDecision.Given, weight: 6 },
    { value: ReplyDecision.Refused, weight: 1 }
  ])
  const method = faker.helpers.weightedArrayElement([
    { value: ReplyMethod.Website, weight: 8 },
    { value: ReplyMethod.Phone, weight: 1 },
    { value: ReplyMethod.Paper, weight: 1 }
  ])

  const healthCondition = faker.helpers.objectKey(healthConditions)
  const healthAnswers = getHealthAnswers(programme.vaccine, healthCondition)
  const triageNote = getTriageNote(healthAnswers, healthCondition)
  const refusalReason = getRefusalReason(programme.type)

  const nowAt = today()
  const sessionClosedBeforeToday = session.closeAt.valueOf() < nowAt.valueOf()
  const sessionOpensAfterToday = session.openAt.valueOf() > nowAt.valueOf()

  // If session hasn’t opened yet, don’t generate a consent
  if (sessionOpensAfterToday) {
    return
  }

  return new Consent({
    createdAt:
      lastConsentCreatedAt ||
      faker.date.between({
        from: session.openAt,
        to: sessionClosedBeforeToday ? session.closeAt : nowAt
      }),
    child,
    parent,
    decision,
    method,
    ...(decision === ReplyDecision.Given && { healthAnswers, triageNote }),
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
    programme_pid: programme.pid,
    session_id: session.id
  })
}
