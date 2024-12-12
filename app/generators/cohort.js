import { Cohort } from '../models/cohort.js'

/**
 * Get NHS Numbers of CHIS records within year group
 *
 * @param {Map<import('../models/record.js').Record>} recordsMap - CHIS records
 * @param {number} yearGroup - Year group
 * @returns {Array} NHS numbers of selected cohort
 */
export function getRecordsFromYearGroup(recordsMap, yearGroup) {
  const yearGroupRecords = new Set()

  recordsMap.forEach((record) => {
    if (record.yearGroup === yearGroup) {
      yearGroupRecords.add(record.nhsn)
    }
  })

  return [...yearGroupRecords]
}

/**
 * Generate fake cohort
 *
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {Map<import('../models/record.js').Record>} recordsMap - Records
 * @param {number} yearGroup - Year group
 * @param {import('../models/user.js').User} user - User
 * @returns {Cohort} - Cohort
 */
export function generateCohort(programme, recordsMap, yearGroup, user) {
  const record_nhsns = getRecordsFromYearGroup(recordsMap, yearGroup)

  return new Cohort({
    created_user_uid: user.uid,
    yearGroup,
    record_nhsns,
    programme_pid: programme.pid
  })
}
