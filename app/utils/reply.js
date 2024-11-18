import { faker } from '@faker-js/faker'
import _ from 'lodash'

import healthConditions from '../datasets/health-conditions.js'
import { Child } from '../models/child.js'
import { ParentalRelationship } from '../models/parent.js'
import { ConsentOutcome } from '../models/patient.js'
import { ProgrammeType } from '../models/programme.js'
import { Reply, ReplyDecision, ReplyRefusal } from '../models/reply.js'

import { getEnumKeyAndValue } from './enum.js'

/**
 * Add example answers to health questions
 *
 * @param {string} key - Health question key
 * @returns {string|boolean} Health answer, or `false`
 */
const enrichWithRealisticAnswer = (key) => {
  const condition = faker.helpers.objectKey(healthConditions)
  const useAnswer = faker.helpers.maybe(() => true, { probability: 0.2 })

  if (healthConditions[condition][key] && useAnswer) {
    return healthConditions[condition][key]
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
 * @param {Array<import('../models/reply.js').Reply>} replies - Consent replies
 * @returns {object|boolean} Combined answers to health questions
 */
export function getConsentHealthAnswers(replies) {
  const answers = {}

  const repliesWithHealthAnswers = Object.values(replies).filter(
    (reply) => reply.healthAnswers
  )

  if (repliesWithHealthAnswers.length === 0) {
    return false
  }

  for (let reply of repliesWithHealthAnswers) {
    reply = new Reply(reply)

    for (const [key, value] of Object.entries(reply.healthAnswers)) {
      if (!answers[key]) {
        answers[key] = {}
      }

      const hasSingleReply = repliesWithHealthAnswers.length === 1
      const hasSameAnswers = repliesWithHealthAnswers.every(
        (reply) => reply.healthAnswers[key] === value
      )

      if (hasSingleReply) {
        answers[key][reply.relationship] = value
      } else if (hasSameAnswers) {
        answers[key].All = value
      } else {
        answers[key][reply.relationship] = value
      }
    }
  }

  return answers
}

/**
 * Get consent outcome
 *
 * @param {import('../models/reply.js').Reply} reply - Reply
 * @returns {object} Consent outcome
 */
export const getConfirmedConsentOutcome = (reply) => {
  const { key } = getEnumKeyAndValue(ReplyDecision, reply.decision)

  if (key === 'NoResponse') {
    return getEnumKeyAndValue(ConsentOutcome, ConsentOutcome.NoResponse)
  }

  if (key === 'Refused' && reply.confirmed) {
    return getEnumKeyAndValue(ConsentOutcome, ConsentOutcome.FinalRefusal)
  }

  return getEnumKeyAndValue(ConsentOutcome, key)
}

/**
 * Get consent outcome
 *
 * @param {import('../models/patient.js').Patient} patient - Patient
 * @returns {object} Consent outcome
 */
export const getConsentOutcome = (patient) => {
  const parentalRelationships = Object.values(ParentalRelationship)
  const replies = Object.values(patient.replies)
    .map((reply) => new Reply(reply))
    .filter((reply) => !reply.invalid)

  if (replies.length === 1) {
    // Reply decision value matches consent outcome key
    return getConfirmedConsentOutcome(replies[0])
  } else if (replies.length > 1) {
    const decisions = _.uniqBy(replies, 'decision')

    if (decisions.length > 1) {
      // If one of the replies is not from parent (so from child), use that
      const childReply = replies.find(
        (reply) => !parentalRelationships.includes(reply.relationship)
      )
      if (childReply) {
        return getConfirmedConsentOutcome(childReply)
      }

      return getEnumKeyAndValue(ConsentOutcome, ConsentOutcome.Inconsistent)
    }
    return getConfirmedConsentOutcome(decisions[0])
  }

  return getEnumKeyAndValue(ConsentOutcome, ConsentOutcome.NoResponse)
}

/**
 * Get combined refusal reasons
 *
 * @param {Array<import('../models/reply.js').Reply>} replies - Consent replies
 * @returns {Array} Refusal reasons
 */
export const getConsentRefusalReasons = (replies) => {
  const reasons = []

  for (const reply of Object.values(replies)) {
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
 * @returns {object} Health answers
 */
export const getHealthAnswers = (vaccine) => {
  const answers = {}

  for (const key of vaccine.healthQuestionKeys) {
    answers[key] = enrichWithRealisticAnswer(key)
  }

  return answers
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

  return names.size ? [...names].join(', ') : false
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
