import { Cohort } from '../models/cohort.js'

/**
 * Generate fake cohort
 *
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {number} yearGroup - Year group
 * @param {import('../models/user.js').User} user - User
 * @returns {Cohort} Cohort
 */
export function generateCohort(programme, yearGroup, user) {
  return new Cohort({
    createdBy_uid: user.uid,
    yearGroup,
    year: programme.year,
    programme_id: programme.id
  })
}
