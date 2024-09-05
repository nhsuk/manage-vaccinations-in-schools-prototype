import { Record } from '../models/record.js'

/**
 * Get NHS Numbers of CHIS records within age range
 * @param {Array} records - CHIS records
 * @param {number} minAge - Minimum age
 * @param {number} maxAge - Maximum age
 * @returns {Array} NHS numbers of selected cohort
 */
export function getCohortFromAgeRange(records, minAge, maxAge) {
  const ages = Array(maxAge - minAge + 1)
    .fill()
    .map((_, index) => minAge + index)

  return Object.values(records)
    .filter((record) => ages.includes(record.age))
    .map((record) => record.nhsn)
}

/**
 * Get NHS Numbers of CHIS records within a year group
 * @param {Array} records - CHIS records
 * @param {number} yearGroup - Year group
 * @returns {Array} NHS numbers of selected cohort
 */
export function getCohortFromYearGroup(records, yearGroup) {
  return Object.values(records)
    .map((record) => new Record(record))
    .filter((record) => record.yearGroup === yearGroup)
    .map((record) => record.nhsn)
}
