import { ReplyDecision } from '../models/reply.js'

import { camelToKebabCase } from './string.js'

const getHealthQuestionPath = (key, pathPrefix) => {
  return `${pathPrefix}health-question-${camelToKebabCase(key)}`
}

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
  if (decision === ReplyDecision.OnlyMenACWY) {
    session.healthQuestions.delete('recentTdIpvVaccination')
  } else if (decision === ReplyDecision.OnlyTdIPV) {
    session.healthQuestions.delete('recentMenAcwyVaccination')
  }

  // Add paths for each health question, with forks for conditional questions
  const healthQuestions = [...session.healthQuestions.entries()]
  healthQuestions.forEach(([key, question], index) => {
    const questionPath = getHealthQuestionPath(key, pathPrefix)

    if (question.conditional) {
      const nextQuestion = healthQuestions[index + 1]
      if (nextQuestion) {
        const forkPath = getHealthQuestionPath(nextQuestion[0], pathPrefix)

        paths[questionPath] = {
          [forkPath]: {
            data: `consent.healthAnswers.${key}.answer`,
            value: 'No'
          }
        }
      } else {
        paths[questionPath] = {}
      }

      // Add paths for conditional sub-questions
      for (const subKey of Object.keys(question.conditional)) {
        const subQuestionPath = getHealthQuestionPath(subKey, pathPrefix)
        paths[subQuestionPath] = {}
      }
    } else {
      paths[questionPath] = {}
    }
  })

  // Ask for refusal reason if consent only given for one vaccination
  if ([ReplyDecision.OnlyMenACWY, ReplyDecision.OnlyTdIPV].includes(decision)) {
    paths[`${pathPrefix}refusal-reason`] = {}
  }

  return paths
}
