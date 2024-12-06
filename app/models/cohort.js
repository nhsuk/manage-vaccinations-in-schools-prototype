import { formatLink, formatYearGroup } from '../utils/string.js'

import { Programme, ProgrammeType } from './programme.js'
import { Record } from './record.js'

export class AcademicYear {
  static Y2024 = '2024/25'
}

/**
 * Get NHS Numbers of CHIS records within year group
 *
 * @param {Map<import('./record.js').Record>} records - CHIS records
 * @param {number} yearGroup - Year group
 * @returns {Array} NHS numbers of selected cohort
 */
export function getRecordsFromYearGroup(records, yearGroup) {
  const yearGroupRecords = new Set()

  records.forEach((record) => {
    if (record.yearGroup === yearGroup) {
      yearGroupRecords.add(record.nhsn)
    }
  })

  return [...yearGroupRecords]
}

/**
 * @class Cohort
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} uid - UID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created cohort
 * @property {AcademicYear} year - Academic year
 * @property {number} yearGroup - Year group
 * @property {Array<string>} record_nhsns - Records NHS numbers
 * @property {string} [programme_pid] - Programme ID
 * @function ns - Namespace
 * @function uri - URL
 */
export class Cohort {
  constructor(options, context) {
    const year = options?.year || AcademicYear.Y2024

    this.context = context
    this.created = options?.created || `${year.split('/')[0]}-08-01`
    this.created_user_uid = options?.created_user_uid
    this.year = year
    this.yearGroup = options?.yearGroup
    this.record_nhsns = options?.record_nhsns || []
    this.programme_pid = options?.programme_pid
  }

  /**
   * Generate fake cohort
   *
   * @param {import('./programme.js').Programme} programme - Programme
   * @param {Map<import('./record.js').Record>} recordsMap - Records
   * @param {number} yearGroup - Year group
   * @param {import('./user.js').User} user - User
   * @returns {Cohort} - Cohort
   * @static
   */
  static generate(programme, recordsMap, yearGroup, user) {
    const record_nhsns = getRecordsFromYearGroup(recordsMap, yearGroup)

    return new Cohort({
      created_user_uid: user.uid,
      yearGroup,
      record_nhsns,
      programme_pid: programme.pid
    })
  }

  /**
   * Get UID
   *
   * @returns {string} - UID
   */
  get uid() {
    const yearGroup = String(this.yearGroup).padStart(2, '0')

    return `${this.programme_pid}-${yearGroup}`
  }

  /**
   * Get programme
   *
   * @returns {Programme} - Programme
   */
  get programme() {
    try {
      const programme = this.context?.programmes[this.programme_pid]
      if (programme) {
        return new Programme(programme)
      }
    } catch (error) {
      console.error('Cohort.programme', error.message)
    }
  }

  /**
   * Get cohort records
   *
   * @returns {Array<Record>} - Records
   */
  get records() {
    if (this.context?.records && this.record_nhsns) {
      return this.record_nhsns.map(
        (nhsn) => new Record(this.context?.records[nhsn])
      )
    }

    return []
  }

  /**
   * Get name
   *
   * @returns {string} - Name
   */
  get name() {
    const type = ProgrammeType[this.programme.type]

    return `${type} ${this.formatted.yearGroup} (${this.year})`
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      yearGroup: formatYearGroup(this.yearGroup)
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      name: formatLink(this.uri, this.name)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'cohort'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/programmes/${this.programme_pid}/cohorts/${this.uid}`
  }
}
