import { faker } from '@faker-js/faker'
import campaignTypes from '../datasets/campaign-types.js'
import healthConditions from '../datasets/health-conditions.js'
import { Child } from '../models/child.js'
import { ReplyRefusal } from '../models/reply.js'

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
 * Get faked answers for health questions in a campaign
 * @param {string} type - Campaign type
 * @returns {object} Health answers
 */
export const getHealthAnswers = (type) => {
  const answers = {}

  for (const key of campaignTypes[type].healthQuestions) {
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
  const refusalReasons = Object.values(ReplyRefusal).filter((key) =>
    type !== 'flu' ? key !== 'Gelatine' : key
  )

  return faker.helpers.arrayElement(refusalReasons)
}
