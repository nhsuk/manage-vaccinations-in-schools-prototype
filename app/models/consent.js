import { Reply } from './reply.js'

/**
 * @class Consent
 * @augments Reply
 */
export class Consent extends Reply {
  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'consent'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/consents/${this.session_id}/${this.uuid}`
  }
}
