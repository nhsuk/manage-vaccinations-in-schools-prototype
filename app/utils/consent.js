import { HealthQuestion } from '../datasets/vaccines.js'
import { ReplyDecision } from '../models/reply.js'

import { pascalToKebabCase } from './string.js'

/**
 * Get health question paths for given vaccines
 *
 * @param {string} pathPrefix - Path prefix
 * @param {import('../models/session.js').Session} session - Session
 * @param {ReplyDecision} decision - Reply decision
 * @returns {object} Health question paths
 */
export const getHealthQuestionPaths = (pathPrefix, session, decision) => {
  const paths = {}

  // Only get health question paths for vaccines with consent
  const healthQuestions = new Set(session.healthQuestions)
  if (decision === ReplyDecision.OnlyMenACWY) {
    healthQuestions.delete(HealthQuestion.RecentTdIpvVaccination)
  } else if (decision === ReplyDecision.OnlyTdIPV) {
    healthQuestions.delete(HealthQuestion.RecentMenAcwyVaccination)
  }

  for (const question of [...healthQuestions]) {
    const key = Object.keys(HealthQuestion).find(
      (key) => HealthQuestion[key] === question
    )
    const slug = pascalToKebabCase(key)

    paths[`${pathPrefix}health-question-${slug}`] = {}
  }

  // Ask for refusal reason if consent only given for one vaccination
  if ([ReplyDecision.OnlyMenACWY, ReplyDecision.OnlyTdIPV].includes(decision)) {
    paths[`${pathPrefix}refusal-reason`] = {}
  }

  return paths
}
