import { AcademicYear, ProgrammeType } from '../enums.js'

/**
 * Determines if a patient should be added to a specific cohort
 *
 * @param {import('../models/cohort.js').Cohort} cohort - Cohort
 * @param {import('../models/patient.js').Patient} patient - Patient record
 * @returns {boolean} - Patient eligible for cohort
 */
export function getCohortEligibility(cohort, patient) {
  const academicYears = Object.keys(AcademicYear).map((key) =>
    parseInt(key.substring(1))
  )
  const cohortAcademicYear = parseInt(cohort.year.split(' ')[0])
  const currentAcademicYear = academicYears.at(-1)

  // Calculate year group patient was in during the cohort’s academic year
  const yearDifference = currentAcademicYear - cohortAcademicYear
  const patientYearGroupInCohortYear = patient.yearGroup - yearDifference

  // Check if the patient was in the correct year group for this cohort
  if (patientYearGroupInCohortYear !== cohort.yearGroup) {
    return false
  }

  // Apply programme-specific eligibility rules
  // TODO: Determine eligibility by vaccination record, and add to catch-up year
  switch (cohort.programme.type) {
    case ProgrammeType.Flu:
      // Flu vaccination is available for all year groups
      return cohort.yearGroup >= 0 && cohort.yearGroup <= 11

    case ProgrammeType.HPV:
      // HPV vaccination is only for Year 8
      return cohort.yearGroup === 8

    case ProgrammeType.MenACWY:
      // MenACWY vaccination is only for Year 9
      return cohort.yearGroup === 9

    case ProgrammeType.TdIPV:
      // Td/IPV vaccination is only for Year 9
      return cohort.yearGroup === 9

    default:
      // Unknown programme type
      return false
  }
}
