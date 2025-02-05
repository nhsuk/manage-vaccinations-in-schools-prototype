import { ProgrammeType } from '../models/programme.js'
import { ReplyDecision } from '../models/reply.js'

import { kebabToPascalCase, pascalToKebabCase } from './string.js'

/**
 * Get health question keys
 *
 * @param {Array<import('../models/vaccine.js').Vaccine>} vaccines - Vaccine
 * @returns {Array<string>}
 */
export const getHealthQuestionKeys = (vaccines) => {
  const healthQuestionKeys = new Set()
  for (const vaccine of vaccines) {
    for (const key of vaccine.healthQuestionKeys) {
      healthQuestionKeys.add(key)
    }
  }

  return [...healthQuestionKeys].sort()
}

/**
 * Get health question key from view name
 *
 * @param {string} view - View name
 * @returns {string} Health question key
 */
export const getHealthQuestionKey = (view) => {
  return kebabToPascalCase(view.replace('health-question-', ''))
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
  let vaccines
  switch (decision) {
    case ReplyDecision.OnlyMenACWY:
      vaccines = session.vaccines.filter(
        (vaccine) => vaccine.type !== ProgrammeType.TdIPV
      )
      break
    case ReplyDecision.OnlyTdIPV:
      vaccines = session.vaccines.filter(
        (vaccine) => vaccine.type !== ProgrammeType.MenACWY
      )
      break
    default:
      vaccines = session.vaccines
  }

  const healthQuestionKeys = getHealthQuestionKeys(vaccines)
  for (const key of healthQuestionKeys) {
    const slug = pascalToKebabCase(key)
    paths[`${pathPrefix}health-question-${slug}`] = {}
  }

  // Ask for refusal reason if consent only given for one vaccination
  if ([ReplyDecision.OnlyMenACWY, ReplyDecision.OnlyTdIPV].includes(decision)) {
    paths[`${pathPrefix}refusal-reason`] = {}
  }

  return paths
}
