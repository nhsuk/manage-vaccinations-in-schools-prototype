import { fakerEN_GB as faker } from '@faker-js/faker'
import campaignTypes from '../datasets/campaign-types.js'
import vaccines from '../datasets/vaccines.js'
import { Vaccine } from './vaccine.js'
import {
  addDays,
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate
} from '../utils/date.js'

export class CampaignType {
  static FLU = 'Flu'
  static HPV = 'HPV'
  static TIO = '3-in-1 teenage booster and MenACWY'
}

export class AcademicYear {
  static Y2023 = '2023/24'
  static Y2024 = '2024/25'
}

/**
 * @class Campaign
 * @property {string} uid - UID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created campaign
 * @property {CampaignType} [type] - Campaign type
 * @property {string} [name] - Campaign name
 * @property {string} [year] - Academic year
 * @property {object} [start] - Date consent window opens
 * @property {object} [end] - Date consent window closes
 * @property {Array[string]} cohort - Cohort
 * @property {Array[string]} vaccines - Vaccines administered
 * @function ns - Namespace
 * @function uri - URL
 */
export class Campaign {
  constructor(options) {
    this.uid = options?.uid || this.#uid
    this.created = options?.created || new Date().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.type = options?.type
    this.name = options?.name
    this.year = options?.year
    this.start = options?.start
    this.end = options?.end
    this.cohort = options?.cohort || []
    this.vaccines = options?.vaccines || []
    this.pendingVaccinations = options?.pendingVaccinations || []
    // dateInput objects
    this.start_ = options?.start_
    this.end_ = options?.end_
  }

  static generate(type, cohort, user) {
    // Create session 60-90 days ago
    const today = new Date()
    const created = addDays(today, faker.number.int({ min: 60, max: 90 }) * -1)

    // Ensure cohort only contains unique values
    cohort = [...new Set(cohort)]

    // Use typical dates for winter flu versus other campaigns
    const startDate = type === CampaignType.FLU ? '2023-10-15' : '2024-03-01'
    const endDate = type === CampaignType.FLU ? '2024-02-29' : '2024-06-20'

    return new Campaign({
      type,
      created,
      created_user_uid: user.uuid,
      name: type,
      year: AcademicYear.Y2023,
      start: new Date(startDate),
      end: new Date(endDate),
      cohort,
      vaccines: campaignTypes[type].vaccines
    })
  }

  #uid = faker.helpers.replaceSymbols('???')

  get start_() {
    return convertIsoDateToObject(this.start)
  }

  set start_(object) {
    if (object) {
      this.start = convertObjectToIsoDate(object)
    }
  }

  get end_() {
    return convertIsoDateToObject(this.end)
  }

  set end_(object) {
    if (object) {
      this.end = convertObjectToIsoDate(object)
    }
  }

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
      start: formatDate(this.start, {
        dateStyle: 'long'
      }),
      end: formatDate(this.end, {
        dateStyle: 'long'
      }),
      vaccines: vaccineList.join('<br>')
    }
  }

  get ns() {
    return 'campaign'
  }

  get uri() {
    return `/campaigns/${this.uid}`
  }
}
