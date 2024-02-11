import { fakerEN_GB as faker } from '@faker-js/faker'
import campaignTypes from '../datasets/campaign-types.js'
import vaccines from '../datasets/vaccines.js'
import { Vaccine } from './vaccine.js'
import { addDays } from '../utils/date.js'

/**
 * @class Campaign
 * @property {string} uuid - UUID
 * @property {string} created - Created date
 * @property {string} [created_user_uuid] - User who created campaign
 * @property {string} type - Campaign type
 * @property {string} name - Campaign name
 * @property {Array[string]} cohort - Cohort
 * @property {Array[string]} vaccines - Vaccines administered
 * @function ns - Namespace
 * @function uri - URL
 */
export class Campaign {
  constructor(options) {
    this.uuid = options.uuid || faker.string.uuid()
    this.created = options.created || new Date().toISOString()
    this.created_user_uuid = options?.created_user_uuid
    this.type = options.type
    this.name = options.name
    this.cohort = options.cohort
    this.vaccines = options.vaccines
  }

  static generate(type, cohort, user) {
    // Create session 60-90 days ago
    const today = new Date()
    const created = addDays(today, faker.number.int({ min: 60, max: 90 }) * -1)

    // Ensure cohort only contains unique values
    cohort = [...new Set(cohort)]

    return new Campaign({
      type,
      created,
      created_user_uuid: user.uuid,
      name: campaignTypes[type].name,
      cohort,
      vaccines: campaignTypes[type].vaccines
    })
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

  get formattedType() {
    return campaignTypes[this.type].name
  }

  get ns() {
    return 'campaign'
  }

  get uri() {
    return `/campaigns/${this.uuid}`
  }
}
