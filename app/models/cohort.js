import { ProgrammeType } from './programme.js'
import { Record } from './record.js'
import { formatYearGroup } from '../utils/string.js'

export class AcademicYear {
  static Y2024 = '2024/25'
}

/**
 * Get NHS Numbers of CHIS records within year group
 * @param {Map<Record>} records - CHIS records
 * @param {number} yearGroup - Year group
 * @returns {Array} NHS numbers of selected cohort
 */
export function getRecordsFromYearGroup(records, yearGroup) {
  let yearGroupRecords = new Set()

  records.forEach((record) => {
    if (record.yearGroup === yearGroup) {
      yearGroupRecords.add(record.nhsn)
    }
  })

  return [...yearGroupRecords]
}

/**
 * @class Cohort
 * @property {string} uid - UID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created cohort
 * @property {AcademicYear} year - Academic year
 * @property {number} yearGroup - Year group
 * @property {Array<string>} records - Records NHS numbers
 * @property {string} [programme_pid] - Programme ID
 * @property {ProgrammeType} [programme_type] - Programme type
 * @function ns - Namespace
 * @function uri - URL
 */
export class Cohort {
  constructor(options) {
    this.created_user_uid = options?.created_user_uid
    this.year = options?.year || AcademicYear.Y2024
    this.yearGroup = options?.yearGroup
    this.records = options?.records || []
    this.programme_pid = options?.programme_pid
    this.programme_type = options?.programme_type
  }

  static generate(programme, records, yearGroup, user) {
    records = getRecordsFromYearGroup(records, yearGroup)

    return new Cohort({
      created_user_uid: user.uid,
      yearGroup,
      records,
      programme_pid: programme.pid,
      programme_type: programme.type
    })
  }

  get uid() {
    const yearGroup = String(this.yearGroup).padStart(2, '0')

    return `${this.programme_pid}-${yearGroup}`
  }

  get created() {
    const year = this.year.split('/')[0]

    return `${year}-08-01`
  }

  get name() {
    const type = ProgrammeType[this.programme_type]

    return `${type} ${this.formatted.yearGroup} (${this.year})`
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
    return `/programmes/${this.programme_pid}/cohorts/${this.uid}`
  }
}
