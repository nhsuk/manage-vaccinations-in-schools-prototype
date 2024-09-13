import { fakerEN_GB as faker } from '@faker-js/faker'
import { ProgrammeYear } from './programme.js'
import { Record } from './record.js'
import { addDays } from '../utils/date.js'
import { formatLink } from '../utils/string.js'

/**
 * Get NHS Numbers of CHIS records within year group
 * @param {Array} records - CHIS records
 * @param {Array<number>} yearGroup - Year group
 * @returns {Array} NHS numbers of selected cohort
 */
export function getRecordsFromYearGroup(records, yearGroups) {
  return Object.values(records)
    .map((record) => new Record(record))
    .filter((record) => yearGroups.includes(record.yearGroup))
    .map((record) => record.nhsn)
}

/**
 * @class Cohort
 * @property {string} uid - UID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created cohort
 * @property {string} [programme_pid] - Programme ID
 * @property {import('./programme.js').ProgrammeType} [type] - Cohort type
 * @property {ProgrammeYear} [year] - Cohort year
 * @property {Array[string]} records - Patient records
 * @property {Array[string]} vaccines - Vaccines administered
 * @function ns - Namespace
 * @function uri - URL
 */
export class Cohort {
  constructor(options) {
    this.uid = options?.uid || this.#uid
    this.created = options?.created || new Date().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.programme_pid = options?.programme_pid
    this.type = options?.type
    this.year = options?.year || ProgrammeYear.Y2024
    this.records = options?.records || []
  }

  static generate(programme, records, user) {
    // Create session 60-90 days ago
    const today = new Date()
    const created = addDays(today, faker.number.int({ min: 60, max: 90 }) * -1)

    records = getRecordsFromYearGroup(records, programme.yearGroups)

    return new Cohort({
      created,
      created_user_uid: user.uuid,
      programme_pid: programme.pid,
      type: programme.type,
      records
    })
  }

  #uid = faker.helpers.replaceSymbols('???')

  get link() {
    return {
      typeAndYear: `<span class="nhsuk-u-secondary-text-color">
        ${formatLink(this.uri, this.type)}</br>
        ${this.year}
      </span>`
    }
  }

  get ns() {
    return 'cohort'
  }

  get uri() {
    return `/cohorts/${this.uid}`
  }
}
