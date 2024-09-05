import { fakerEN_GB as faker } from '@faker-js/faker'
import campaignTypes from '../datasets/campaign-types.js'
import { formatDate } from '../utils/date.js'

/**
 * Get NHS Numbers of CHIS records within age range
 * @param {Array} records - CHIS records
 * @param {number} minAge - Minimum age
 * @param {number} maxAge - Maximum age
 * @returns {Array} NHS numbers of selected cohort
 */
function getCohortFromAgeRange(records, minAge, maxAge) {
  const ages = Array(maxAge - minAge + 1)
    .fill()
    .map((_, index) => minAge + index)

  return Object.values(records)
    .filter((record) => ages.includes(record.age))
    .map((record) => record.nhsn)
}

export class AcademicYear {
  static Y2019 = '2019/20'
  static Y2020 = '2020/21'
  static Y2021 = '2021/22'
  static Y2022 = '2022/23'
  static Y2023 = '2023/24'
  static Y2024 = '2024/25'
}

/**
 * @class Cohort upload
 * @property {string} uuid - Cohort upload UUID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created upload
 * @property {AcademicYear} [year] - Academic year
 * @property {string} [campaign_uid] - Campaign UID
 * @property {Array<string>} [records] - Child records
 * @property {Array<string>} [exact] - Exact duplicate records found
 * @property {Array<string>} [inexact] - Inexact duplicate records found
 * @function ns - Namespace
 * @function uri - URL
 */
export class Cohort {
  constructor(options) {
    this.uuid = options?.id || faker.string.uuid()
    this.created = options?.created || new Date().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.year = options?.year
    this.campaign_uid = options?.campaign_uid
    this.records = options?.records || []
    this.incomplete = options?.incomplete || []
    this.exact = options?.exact || []
    this.inexact = options?.inexact || []
  }

  static generate(campaign, records, user) {
    const created = faker.date.recent()

    const { minAge, maxAge } = campaignTypes[campaign.type]
    records = getCohortFromAgeRange(records, minAge, maxAge)

    // Ensure cohort only contain unique records
    records = [...new Set(records)]

    return new Cohort({
      created,
      created_user_uid: user?.uid || '000123456789',
      year: AcademicYear.Y2024,
      campaign_uid: campaign.uid,
      records
    })
  }

  get formatted() {
    return {
      created: formatDate(this.created, {
        dateStyle: 'long',
        timeStyle: 'short',
        hourCycle: 'h12'
      })
    }
  }

  get ns() {
    return 'cohort'
  }

  get uri() {
    return `/campaigns/${this.campaign_uid}/cohort`
  }
}
