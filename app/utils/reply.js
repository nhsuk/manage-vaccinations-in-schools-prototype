import _ from 'lodash'
import { faker } from '@faker-js/faker'
import healthConditions from '../datasets/health-conditions.js'
import { Child } from '../models/child.js'
import { ConsentOutcome } from '../models/patient.js'
import { ReplyDecision, ReplyRefusal } from '../models/reply.js'
import { getEnumKeyAndValue } from './enum.js'

/**
 * Add example answers to health questions
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
 * Get consent outcome
 * @param {import('../models/patient.js').Patient} patient - Patient
 * @returns {string} Consent outcome
 */
export const getConsentOutcome = (patient) => {
  const replies = Object.values(patient.replies).map(
    (reply) => new Reply(reply)
  )

  if (replies.length === 1) {
    // Reply decision value matches consent outcome key
    const { key } = getEnumKeyAndValue(ReplyDecision, replies[0].decision)
    return getEnumKeyAndValue(ConsentOutcome, key)
  } else if (replies.length > 1) {
    // Exclude invalid responses
    const decisions = _.uniqBy(replies, 'decision').filter(
      (reply) => reply.decision !== ReplyDecision.Invalid
    )
    if (decisions.length > 1) {
      return getEnumKeyAndValue(ConsentOutcome, ConsentOutcome.Inconsistent)
    } else if (decisions[0].decision === ReplyDecision.Given) {
      return getEnumKeyAndValue(ConsentOutcome, ConsentOutcome.Given)
    } else if (decisions[0].decision === ReplyDecision.Refused) {
      return getEnumKeyAndValue(ConsentOutcome, ConsentOutcome.Refused)
    }
  } else {
    return getEnumKeyAndValue(ConsentOutcome, ConsentOutcome.NoResponse)
  }

  return
}

/**
 * Get faked answers for health questions needed for a vaccine
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
 * @param {Array<import('../models/reply.js').Reply>} replies - Consent replies
 * @returns {string|boolean} Names(s)
 */
export const getPreferredNames = (replies) => {
  const names = []

  Object.values(replies).map((reply) => {
    const child = new Child(reply.child)
    if (child.preferredName) {
      names.push(child.preferredName)
    }
  })

  return names.length ? [...new Set(names)].join(', ') : false
}

/**
 * Get valid refusal reasons for a campaign
 * @param {string} type - Campaign type
 * @returns {string} Refusal reason
 */
export const getRefusalReason = (type) => {
  // Gelatine content only a valid refusal reason for flu vaccine
  const refusalReasons = Object.values(ReplyRefusal).filter((value) =>
    type !== 'flu' ? value !== ReplyRefusal.Gelatine : value
  )

  return faker.helpers.arrayElement(refusalReasons)
}
