import { kebabToPascalCase, pascalToKebabCase } from './string.js'

/**
 * Get health question key from view name
 * @param {string} view - View name
 * @returns Health question key
 */
export const getHealthQuestionKey = (view) => {
  return kebabToPascalCase(view.replace('health-question-', ''))
}

/**
 * Get health question paths for a given vaccine
 * @param {import('../models/vaccine.js').Vaccine} vaccine - Vaccine
 * @param {string} pathPrefix - Path prefix
 * @returns {object} Health question paths
 */
export const getHealthQuestionPaths = (pathPrefix, vaccine) => {
  const { healthQuestionKeys } = vaccine

  const paths = {}
  for (const key of healthQuestionKeys) {
    const slug = pascalToKebabCase(key)
    paths[`${pathPrefix}health-question-${slug}`] = {}
  }

  return paths
}
