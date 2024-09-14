import { ProgrammeCycle } from './programme.js'
import { Record } from './record.js'
import { formatYearGroup } from '../utils/string.js'

/**
 * Get NHS Numbers of CHIS records within year group
 * @param {Array} records - CHIS records
 * @param {number} yearGroup - Year group
 * @returns {Array} NHS numbers of selected cohort
 */
export function getRecordsFromYearGroup(records, yearGroup) {
  return Object.values(records)
    .map((record) => new Record(record))
    .filter((record) => record.yearGroup === yearGroup)
    .map((record) => record.nhsn)
}

/**
 * @class Cohort
 * @property {string} uid - UID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created cohort
 * @property {ProgrammeCycle} cycle - Programme cycle
 * @property {number} yearGroup - Year group
 * @property {Array[string]} records - Records
 * @function ns - Namespace
 * @function uri - URL
 */
export class Cohort {
  constructor(options) {
    this.created_user_uid = options?.created_user_uid
    this.cycle = options?.cycle || ProgrammeCycle.Y2024
    this.yearGroup = options?.yearGroup
    this.records = options?.records || []
  }

  static generate(records, yearGroup, user) {
    records = getRecordsFromYearGroup(records, yearGroup)

    return new Cohort({
      created_user_uid: user.uuid,
      yearGroup,
      records
    })
  }

  get uid() {
    const yearGroup = String(this.yearGroup).padStart(2, '0')

    return `${this.year}-${yearGroup}`
  }

  get created() {
    return `01-09-${this.year}`
  }

  get name() {
    return `${this.formatted.yearGroup} (${this.cycle})`
  }

  get year() {
    return this.cycle.split('/')[0]
  }

  get formatted() {
    return {
      yearGroup: formatYearGroup(this.yearGroup)
    }
  }

  get ns() {
    return 'cohort'
  }

  get uri() {
    return `/cohorts/${this.uid}`
  }
}
