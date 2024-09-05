import { fakerEN_GB as faker } from '@faker-js/faker'
import { getCohortFromYearGroup } from '../utils/cohort.js'
import { formatDate } from '../utils/date.js'
import { formatYearGroup } from '../utils/string.js'

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
 * @property {string} [name] - Name
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
    this.uuid = options?.uuid || faker.string.uuid()
    this.created = options?.created || new Date().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.name = options?.name
    this.year = options?.year
    this.campaign_uid = options?.campaign_uid
    this.records = options?.records || []
    this.incomplete = options?.incomplete || []
    this.exact = options?.exact || []
    this.inexact = options?.inexact || []
  }

  static generate(campaign, records, user, yearGroup) {
    const created = faker.date.recent()

    records = getCohortFromYearGroup(records, yearGroup)

    // Ensure cohort only contain unique records
    records = [...new Set(records)]

    return new Cohort({
      created,
      created_user_uid: user?.uid || '000123456789',
      name: formatYearGroup(yearGroup),
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
    return `/campaigns/${this.campaign_uid}/cohorts/${this.uuid}`
  }
}
