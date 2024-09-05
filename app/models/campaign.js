import { fakerEN_GB as faker } from '@faker-js/faker'
import campaignTypes from '../datasets/campaign-types.js'
import vaccines from '../datasets/vaccines.js'
import { Vaccine } from './vaccine.js'
import { addDays } from '../utils/date.js'

export class CampaignType {
  static FLU = 'Flu'
  static HPV = 'HPV'
  static TIO = '3-in-1 teenage booster and MenACWY'
}

/**
 * @class Campaign
 * @property {string} uid - UID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created campaign
 * @property {CampaignType} [type] - Campaign type
 * @property {Array[string]} cohort - Cohort
 * @property {Array[string]} vaccines - Vaccines administered
 * @property {Array[string]} pendingCohort - Pending cohort record NHS numbers
 * @property {Array[string]} pendingVaccinations - Pending vaccinations UUIDS
 * @function ns - Namespace
 * @function uri - URL
 */
export class Campaign {
  constructor(options) {
    this.uid = options?.uid || this.#uid
    this.created = options?.created || new Date().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.type = options?.type
    this.cohort = options?.cohort || []
    this.vaccines = options?.vaccines || []
    this.pendingCohort = options?.pendingCohort || []
    this.pendingVaccinations = options?.pendingVaccinations || []
  }

  static generate(type, user) {
    // Create session 60-90 days ago
    const today = new Date()
    const created = addDays(today, faker.number.int({ min: 60, max: 90 }) * -1)

    return new Campaign({
      type,
      created,
      created_user_uid: user.uuid,
      vaccines: campaignTypes[type].vaccines
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

  get ns() {
    return 'campaign'
  }

  get uri() {
    return `/campaigns/${this.uid}`
  }
}
