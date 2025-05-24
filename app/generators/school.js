import schools from '../datasets/schools.js'
import { School } from '../models/school.js'

/**
 * Generate school
 *
 * @param {string} urn - School URN
 * @returns {School} - School
 */
export function generateSchool(urn) {
  return new School({
    ...schools[urn],
    address: schools[urn]
  })
}
