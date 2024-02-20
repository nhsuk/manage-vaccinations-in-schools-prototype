import { faker } from '@faker-js/faker'
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
