import { fakerEN_GB as faker } from '@faker-js/faker'
import vaccines from '../datasets/vaccines.js'
import { programmeTypes, ProgrammeYear } from './programme.js'
import { Record } from './record.js'
import { Vaccine } from './vaccine.js'
import { addDays } from '../utils/date.js'
import { formatLink } from '../utils/string.js'

/**
 * Get NHS Numbers of CHIS records within year group
 * @param {Array} records - CHIS records
 * @param {Array<number>} yearGroup - Year group
 * @returns {Array} NHS numbers of selected cohort
 */
export function getCohortFromYearGroups(records, yearGroups) {
  return Object.values(records)
    .map((record) => new Record(record))
    .filter((record) => yearGroups.includes(record.yearGroup))
    .map((record) => record.nhsn)
}

/**
 * @class Campaign
 * @property {string} uid - UID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created campaign
 * @property {string} [programme_pid] - Programme ID
 * @property {import('./programme.js').ProgrammeType} [type] - Campaign type
 * @property {ProgrammeYear} [year] - Campaign year
 * @property {Array[string]} records - Patient records
 * @property {Array[string]} vaccines - Vaccines administered
 * @function ns - Namespace
 * @function uri - URL
 */
export class Campaign {
  constructor(options) {
    this.uid = options?.uid || this.#uid
    this.created = options?.created || new Date().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.programme_pid = options?.programme_pid
    this.type = options?.type
    this.year = options?.year || ProgrammeYear.Y2024
    this.records = options?.records || []
    this.vaccines = options?.vaccines || []
  }

  static generate(programme, records, user) {
    // Create session 60-90 days ago
    const today = new Date()
    const created = addDays(today, faker.number.int({ min: 60, max: 90 }) * -1)

    records = getCohortFromYearGroups(records, programme.yearGroups)

    return new Campaign({
      created,
      created_user_uid: user.uuid,
      programme_pid: programme.pid,
      type: programme.type,
      records,
      vaccines: programmeTypes[programme.type].vaccines
    })
  }

  #uid = faker.helpers.replaceSymbols('???')

  /**
   * @todo A campaign can use multiple vaccines, and one used for a patient will
   * depend on answers to screening questions in consent flow. For now however,
   * we’ll assume each campaign administers one vaccine.
   * @returns {import('./vaccine.js').Vaccine} Vaccine
   */
  get vaccine() {
    return new Vaccine(vaccines[this.vaccines[0]])
  }

  get formatted() {
    const vaccineList = Array.isArray(this.vaccines)
      ? this.vaccines.map((gtin) => new Vaccine(vaccines[gtin]).brandWithName)
      : []

    return {
      vaccines: vaccineList.join('<br>')
    }
  }

  get link() {
    return {
      typeAndYear: `<span class="nhsuk-u-secondary-text-color">
        ${formatLink(this.uri, this.type)}</br>
        ${this.year}
      </span>`
    }
  }

  get ns() {
    return 'campaign'
  }

  get uri() {
    return `/campaigns/${this.uid}`
  }
}
