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
 * @param {Array<import('../models/vaccine.js').Vaccine>} vaccines - Vaccines
 * @returns {object} Health question paths
 */
export const getHealthQuestionPaths = (pathPrefix, vaccines) => {
  // Merge health question keys across all vaccines
  const healthQuestionKeys = new Set()
  for (const vaccine of vaccines) {
    for (const key of vaccine.healthQuestionKeys) {
      healthQuestionKeys.add(key)
    }
  }

  const paths = {}
  for (const key of [...healthQuestionKeys]) {
    const slug = pascalToKebabCase(key)
    paths[`${pathPrefix}health-question-${slug}`] = {}
  }

  return paths
}
