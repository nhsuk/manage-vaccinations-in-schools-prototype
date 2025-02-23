import { faker } from '@faker-js/faker'
import _ from 'lodash'

import healthConditions from '../datasets/health-conditions.js'
import { Child } from '../models/child.js'
import { ParentalRelationship } from '../models/parent.js'
import { ConsentOutcome } from '../models/patient-session.js'
import { ProgrammeType } from '../models/programme.js'
import { ReplyDecision, ReplyRefusal } from '../models/reply.js'

import { formatParentalRelationship } from './string.js'

/**
 * Add example answers to health questions
 *
 * @param {string} key - Health question key
 * @param {string} healthCondition - Health condition
 * @returns {string|boolean} Health answer, or `false`
 */
const enrichWithRealisticAnswer = (key, healthCondition) => {
  const useAnswer = faker.helpers.maybe(() => true, { probability: 0.2 })

  if (healthConditions[healthCondition][key] && useAnswer) {
    return healthConditions[healthCondition][key]
  }

  return false
}

/**
 * Get consent responses with answers to health questions
 *
 * @param {Array} replies - Consent responses
 * @returns {Array} Consent responses with answers to health questions
 */
export function getRepliesWithHealthAnswers(replies) {
  replies = Array.isArray(replies) ? replies : [replies]

  return replies.filter(
    (reply) =>
      reply.healthAnswers &&
      Object.values(reply.healthAnswers).some((value) => value !== false)
  )
}

/**
 * Get combined answers to health questions
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object|boolean} Combined answers to health questions
 */
export function getConsentHealthAnswers(patientSession) {
  const answers = {}

  // Get consent responses with health answers
  const responsesWithHealthAnswers = Object.values(
    patientSession.responses
  ).filter((reply) => reply.healthAnswers)

  if (responsesWithHealthAnswers.length === 0) {
    return false
  }

  for (const response of responsesWithHealthAnswers) {
    for (const [key, value] of Object.entries(response.healthAnswers)) {
      if (!answers[key]) {
        answers[key] = {}
      }

      const hasSingleResponse = responsesWithHealthAnswers.length === 1
      const hasSameAnswers = responsesWithHealthAnswers.every(
        (reply) => reply.healthAnswers[key] === value
      )
      const relationship = formatParentalRelationship(response.parent)

      if (hasSingleResponse) {
        answers[key][relationship] = value
      } else if (hasSameAnswers) {
        answers[key].All = value
      } else {
        // TODO: Fix multiple consent responses for different programmes but from same parent getting merged.
        answers[key][relationship] = value
      }
    }
  }

  return answers
}

/**
 * Get consent outcome
 *
 * @param {import('../models/reply.js').Reply} reply - Reply
 * @returns {ConsentOutcome} Consent outcome
 */
export const getConfirmedConsentOutcome = (reply) => {
  if (reply.decision === ReplyDecision.NoResponse) {
    return ConsentOutcome.NoResponse
  }

  if (reply.decision === ReplyDecision.Refused && reply.confirmed) {
    return ConsentOutcome.FinalRefusal
  }

  return reply.decision
}

/**
 * Get consent outcome
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {ConsentOutcome} Consent outcome
 */
export const getConsentOutcome = (patientSession) => {
  const parentalRelationships = Object.values(ParentalRelationship)

  // Get valid replies
  // Include undelivered replies so can return ConsentOutcome.NoRequest
  let replies = Object.values(patientSession.replies).filter(
    (reply) => !reply.invalid
  )

  if (replies.length === 1) {
    // Check if request was delivered
    if (!replies[0].delivered) {
      return ConsentOutcome.NoRequest
    }

    // Reply decision value matches consent outcome key
    return getConfirmedConsentOutcome(replies[0])
  } else if (replies.length > 1) {
    // Exclude undelivered replies so can return ConsentOutcome.NoRequest
    replies = replies.filter((reply) => reply.delivered)

    // If no replies, no requests were delivered
    if (replies.length === 0) {
      return ConsentOutcome.NoRequest
    }

    const decisions = _.uniqBy(replies, 'decision')
    if (decisions.length > 1) {
      // If one of the replies is not from parent (so from child), use that
      const childReply = replies.find(
        (reply) => !parentalRelationships.includes(reply.relationship)
      )
      if (childReply) {
        return getConfirmedConsentOutcome(childReply)
      }

      return ConsentOutcome.Inconsistent
    }
    return getConfirmedConsentOutcome(decisions[0])
  }

  return ConsentOutcome.NoResponse
}

/**
 * Get combined refusal reasons
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {Array} Refusal reasons
 */
export const getConsentRefusalReasons = (patientSession) => {
  const reasons = []

  // Get consent responses with a refusal reason
  const repliesWithRefusalReasons = Object.values(
    patientSession.replies
  ).filter((reply) => reply.refusalReason)

  for (const reply of repliesWithRefusalReasons) {
    if (reply.refusalReason && !reply.invalid) {
      // Indicate confirmed refusal reason
      const refusalReason = reply.confirmed
        ? `${reply.refusalReason}<br><b>Confirmed</b>`
        : reply.refusalReason

      reasons.push(refusalReason)
    }
  }

  return reasons ? [...new Set(reasons)] : []
}

/**
 * Get faked answers for health questions needed for a vaccine
 *
 * @param {import('../models/vaccine.js').Vaccine} vaccine - Vaccine
 * @param {string} healthCondition - Health condition
 * @returns {object} Health answers
 */
export const getHealthAnswers = (vaccine, healthCondition) => {
  const answers = {}

  for (const key of vaccine.healthQuestionKeys) {
    answers[key] = enrichWithRealisticAnswer(key, healthCondition)
  }

  return answers
}

/**
 * Get faked triage note for health answer given for a child’s health condition
 *
 * @param {object} healthAnswers - Health answers
 * @param {string} healthCondition - Health condition
 * @returns {string} Triage note
 */
export const getTriageNote = (healthAnswers, healthCondition) => {
  const healthAnswersNeedsTriage = Object.values(healthAnswers)
    .flatMap((answer) => answer !== false)
    .includes(true)

  if (healthAnswersNeedsTriage) {
    return healthConditions[healthCondition].triageNote
  }
}

/**
 * Get child’s preferred names, based on information in consent replies
 *
 * @param {Array<import('../models/reply.js').Reply>} replies - Consent replies
 * @returns {string|boolean} Names(s)
 */
export const getPreferredNames = (replies) => {
  const names = new Set()

  Object.values(replies).forEach((reply) => {
    const child = new Child(reply.child)
    if (child.preferredName) {
      names.add(child.preferredName)
    }
  })

  return names.size && [...names].join(', ')
}

/**
 * Get valid refusal reasons for a programme
 *
 * @param {ProgrammeType} type - Programme type
 * @returns {string} Refusal reason
 */
export const getRefusalReason = (type) => {
  // Gelatine content only a valid refusal reason for flu vaccine
  const refusalReasons = Object.values(ReplyRefusal).filter((value) =>
    type !== ProgrammeType.Flu ? value !== ReplyRefusal.Gelatine : value
  )

  return faker.helpers.arrayElement(refusalReasons)
}
