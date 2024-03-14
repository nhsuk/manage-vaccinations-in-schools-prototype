import { fakerEN_GB as faker } from '@faker-js/faker'

export class GillickCompetent {
  static Yes = 'Yes, they are Gillick competent'
  static No = 'No'
}

/**
 * @class Gillick assessment
 * @property {string} uuid - UUID
 * @property {string} created - Created date
 * @property {string} [created_user_uuid] - User who created session
 * @property {GillickCompetent} [competence] - Competence decision
 * @property {string} [assessment] - Assessment details
 * @function ns - Namespace
 */
export class Gillick {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.created = options?.created || new Date().toISOString()
    this.created_user_uuid = options?.created_user_uuid
    this.competence = options?.competence
    this.assessment = options?.assessment
  }

  get ns() {
    return 'gillick'
  }
}
