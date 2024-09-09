import { fakerEN_GB as faker } from '@faker-js/faker'
import campaignTypes from '../datasets/campaign-types.js'
import { Record } from './record.js'
import { formatDate } from '../utils/date.js'
import { formatYearGroupRange } from '../utils/string.js'

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
 * @class Cohort upload
 * @property {string} uuid - Cohort upload UUID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created upload
 * @property {Array<number>} [yearGroups] - School year group(s)
 * @property {string} [type] - Campaign type
 * @property {string} [campaign_uid] - Campaign UID
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
    this.yearGroups = options?.yearGroups || []
    this.type = options?.type
    this.campaign_uid = options?.campaign_uid
    this.records = options?.records || []
    this.incomplete = options?.incomplete || []
    this.exact = options?.exact || []
    this.inexact = options?.inexact || []
  }

  static generate(campaign, records, user, yearGroups) {
    const created = faker.date.recent()

    records = getCohortFromYearGroups(records, yearGroups)

    // Ensure cohort only contain unique records
    records = [...new Set(records)]

    return new Cohort({
      created,
      created_user_uid: user?.uid || '000123456789',
      yearGroups,
      year: campaign.year,
      type: campaign.type,
      campaign_uid: campaign.uid
    })
  }

  static generateAll(campaign, records, user) {
    const { yearGroups, seasonal } = campaignTypes[campaign.type]
    let cohorts = []

    if (seasonal) {
      // All year groups in one cohort
      const cohort = this.generate(campaign, records, user, yearGroups)
      cohorts.push(cohort)
    } else {
      for (const group of yearGroups) {
        // One year group per cohort
        const cohort = this.generate(campaign, records, user, [group])
        cohorts.push(cohort)
      }
    }

    return cohorts
  }

  get formatted() {
    return {
      created: formatDate(this.created, {
        dateStyle: 'long',
        timeStyle: 'short',
        hourCycle: 'h12'
      }),
      yearGroups: formatYearGroupRange(this.yearGroups)
    }
  }

  get ns() {
    return 'cohort'
  }

  get uri() {
    return `/campaigns/${this.campaign_uid}/cohorts/${this.uuid}`
  }
}
