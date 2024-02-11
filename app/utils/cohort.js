import campaignTypes from '../datasets/campaign-types.js'

/**
 * Get NHS Numbers of CHIS records within age range
 * @param {Array} records - CHIS records
 * @param {number} minAge - Minimum age
 * @param {number} maxAge - Maximum age
 * @returns {Array} NHS numbers of selected cohort
 */
export const getCohortFromAgeRange = (records, minAge, maxAge) => {
  const ages = Array(maxAge - minAge + 1)
    .fill()
    .map((_, index) => minAge + index)

  return Object.values(records)
    .filter((record) => ages.includes(record.age))
    .map((record) => record.nhsn)
}

/**
 * Create a campaign cohort
 * @param {string} type - Campaign type
 * @param {Array} records - CHIS records
 * @returns {Array} Cohort
 */
export const createCohort = (type, records) => {
  const { minAge, maxAge } = campaignTypes[type]
  return getCohortFromAgeRange(records, minAge, maxAge)
}
