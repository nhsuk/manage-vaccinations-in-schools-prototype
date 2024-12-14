import _ from 'lodash'

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

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Consent>|undefined} Consents
   * @static
   */
  static readAll(context) {
    return Object.values(context.replies)
      .map((consent) => new Consent(consent, context))
      .filter((consent) => !consent.patient_uuid)
  }

  /**
   * Read
   *
   * @param {string} uuid - Consent UUID
   * @param {object} context - Context
   * @returns {Consent|undefined} Consent
   * @static
   */
  static read(uuid, context) {
    if (context?.replies) {
      return new Consent(context.replies[uuid], context)
    }
  }

  /**
   * Create
   *
   * @param {Consent} consent - Consent
   * @param {object} context - Context
   */
  create(consent, context) {
    consent = new Consent(consent)

    // Update context
    context.replies = context.replies || {}
    context.replies[consent.uuid] = consent
  }

  /**
   * Update
   *
   * @param {object} updates - Updates
   * @param {object} context - Context
   */
  update(updates, context) {
    this.updated = new Date()

    // Remove consent context
    delete this.context

    // Delete original download (with previous ID)
    delete context.replies[this.uuid]

    // Update context
    const updatedConsent = _.merge(this, updates)
    context.replies[updatedConsent.uuid] = updatedConsent
  }
}
