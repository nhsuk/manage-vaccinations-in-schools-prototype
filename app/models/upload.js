import { fakerEN_GB as faker } from '@faker-js/faker'
import { formatDate } from '../utils/date.js'

/**
 * @class National Immunisation and Vaccination System (NIVS) upload
 * @property {string} id - Upload ID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created upload
 * @property {Array<string>} [vaccinations] - Vaccination UUIDs
 * @property {string} [campaign_uid] - Campaign UID
 * @function ns - Namespace
 * @function uri - URL
 */
export class Upload {
  constructor(options) {
    this.id = options?.id || faker.string.hexadecimal({ length: 8, prefix: '' })
    this.created = options?.created || new Date().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.campaign_uid = options?.campaign_uid
    this.vaccinations = options?.vaccinations || []
  }

  static generate(campaign, user, vaccinations) {
    const created = faker.date.recent()

    return new Upload({
      created,
      created_user_uid: user.uid,
      campaign_uid: campaign.uid,
      vaccinations
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
    return 'upload'
  }

  get uri() {
    return `/campaigns/${this.campaign_uid}/uploads/${this.id}`
  }
}
