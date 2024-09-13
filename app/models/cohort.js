import { formatYearGroup } from '../utils/string.js'
import { ProgrammeYear } from './programme.js'
import { Record } from './record.js'

/**
 * Get NHS Numbers of CHIS records within year group
 * @param {Array} records - CHIS records
 * @param {Array<number>} yearGroup - Year group
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
 * @property {number} yearGroup - Year group
 * @property {Array[string]} records - Records
 * @function ns - Namespace
 * @function uri - URL
 */
export class Cohort {
  constructor(options) {
    this.year = options?.year || ProgrammeYear.Y2024
    this.yearGroup = options?.yearGroup
    this.records = options?.records || []
  }

  static generate(records, yearGroup) {
    return new Cohort({
      records: getRecordsFromYearGroup(records, yearGroup),
      yearGroup
    })
  }

  get uid() {
    const year = this.year.split('/')[0]
    const yearGroup = String(this.yearGroup).padStart(2, '0')

    return `${year}-${yearGroup}`
  }

  get name() {
    return `${this.formatted.yearGroup} (${this.year})`
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
