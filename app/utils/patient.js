import { ProgrammeType } from '../enums.js'

import { getCurrentAcademicYear } from './date.js'

/**
 * Determines which programme year a patient belongs to
 *
 * @param {import('../models/patient.js').Patient} patient - Patient record
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @returns {number} Year patient becomes eligible for programme
 */
export function getProgrammeYear(patient, programme) {
  if (programme.type === ProgrammeType.Flu) {
    return getCurrentAcademicYear()
  }

  const yearsUntilEligible = programme.targetYearGroup - patient.yearGroup

  return getCurrentAcademicYear() + yearsUntilEligible
}
