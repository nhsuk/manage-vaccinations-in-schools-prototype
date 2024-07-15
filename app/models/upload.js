import { fakerEN_GB as faker } from '@faker-js/faker'

/**
 * @class National Immunisation and Vaccination System (NIVS) upload
 * @property {string} id - Upload ID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created upload
 * @property {Array<string>} [vaccinations] - Vaccination UUIDs
 * @property {string} [campaign_uuid] - Campaign UUID
 * @function ns - Namespace
 * @function uri - URL
 */
export class Upload {
  constructor(options) {
    this.id = options?.id || faker.string.hexadecimal({ length: 8, prefix: '' })
    this.created = options?.created || new Date().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.campaign_uuid = options?.campaign_uuid
    this.vaccinations = options?.vaccinations || []
  }

  static generate(campaign, user, vaccinations) {
    const created = faker.date.recent()

    return new Upload({
      created,
      created_user_uid: user.uid,
      campaign_uuid: campaign.uuid,
      vaccinations
    })
  }

  get formattedCreated() {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'long',
      timeStyle: 'short',
      hourCycle: 'h12'
    }).format(new Date(this.created))
  }

  get ns() {
    return 'upload'
  }

  get uri() {
    return `/campaigns/${this.campaign_uuid}/uploads/${this.id}`
  }
}
