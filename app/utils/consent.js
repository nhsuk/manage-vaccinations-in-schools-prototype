import { kebabToPascalCase, pascalToKebabCase } from './string.js'

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
 * @returns {object} Health question paths
 */
export const getHealthQuestionPaths = (pathPrefix, session) => {
  const paths = {}
  for (const key of session.healthQuestionKeys) {
    const slug = pascalToKebabCase(key)
    paths[`${pathPrefix}health-question-${slug}`] = {}
  }

  return paths
}
