import { fakerEN_GB as faker } from '@faker-js/faker'

import { healthConditions } from '../datasets/health-conditions.js'
import { Consent } from '../models/consent.js'
import { ProgrammeType } from '../models/programme.js'
import { ReplyDecision, ReplyMethod, ReplyRefusal } from '../models/reply.js'
import { removeDays, today } from '../utils/date.js'
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
    { value: ReplyDecision.Given, weight: 10 },
    { value: ReplyDecision.Declined, weight: 3 },
    { value: ReplyDecision.Refused, weight: 1 },
    ...(programme.type === ProgrammeType.Flu
      ? [{ value: ReplyDecision.OnlyFluInjection, weight: 3 }]
      : [])
  ])

  // Has the parent given consent for alternative injected vaccine?
  const alternative =
    programme.type === ProgrammeType.Flu && decision === ReplyDecision.Given
      ? faker.datatype.boolean(0.5)
      : false

  // Reply method
  const method = faker.helpers.weightedArrayElement([
    { value: ReplyMethod.Website, weight: 8 },
    { value: ReplyMethod.Phone, weight: 1 },
    { value: ReplyMethod.Paper, weight: 1 }
  ])

  const healthCondition = faker.helpers.objectKey(healthConditions)
  const healthAnswers = getHealthAnswers(
    patientSession.vaccine,
    healthCondition
  )
  const triageNote = getTriageNote(healthAnswers, healthCondition)
  const refusalReason = getRefusalReason(programme.type, decision)

  // If decision is declined then a follow-up consultation was requested
  const consultation =
    decision === ReplyDecision.Declined &&
    [
      ReplyRefusal.Medical,
      ReplyRefusal.Other,
      ReplyRefusal.OutsideSchool,
      ReplyRefusal.Personal
    ].includes(refusalReason)

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
        to: sessionClosedBeforeToday ? removeDays(session.firstDate, 2) : nowAt
      }),
    child,
    parent,
    decision,
    method,
    ...(decision === ReplyDecision.Given && { alternative }),
    ...([ReplyDecision.Given, ReplyDecision.OnlyFluInjection].includes(
      decision
    ) && { healthAnswers, triageNote }),
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
      }),
      consultation
    }),
    programme_id: programme.id,
    session_id: session.id
  })
}
