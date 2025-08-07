/**
 * Get patient (programme) outcome status properties
 *
 * @param {number} childYearGroup - Child’s year group
 * @param {number} programmeYearGroup - Programme’s year group
 * @param {import('../enums.js').AcademicYear} academicYear - Academic year
 * @returns {Date} Date child becomes eligible for programme
 */
export function getProgrammeEligibilityDate(
  childYearGroup,
  programmeYearGroup,
  academicYear
) {
  // Extract the start year from current academic year string
  const currentStartYear = parseInt(academicYear.split(' ')[0])

  // Calculate how many years until the child reaches programme year group
  const yearsUntilEligible = programmeYearGroup - childYearGroup

  // Calculate the eligible academic year start
  const eligibleStartYear = currentStartYear + yearsUntilEligible

  return new Date(`${eligibleStartYear}-09-01`)
}
