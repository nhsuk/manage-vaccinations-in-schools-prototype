import schoolsData from '../datasets/schools.js'
import { School } from '../models/school.js'

/**
 * Generate school
 *
 * @param {number} urn - School URN
 * @returns {School} - School
 */
export function generateSchool(urn) {
  return new School({
    ...schoolsData[urn],
    address: schoolsData[urn]
  })
}
