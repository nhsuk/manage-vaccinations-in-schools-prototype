import { formatLinkWithSecondaryText } from '../utils/string.js'

import { Reply } from './reply.js'

/**
 * @class Consent
 * @augments Reply
 */
export class Consent extends Reply {
  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      summary: formatLinkWithSecondaryText(
        this.uri,
        this.parent.formatted.fullNameAndRelationship,
        `for ${this.child.fullName}`
      )
    }
  }

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
   * @returns {Array<Reply>|undefined} Replies
   * @static
   */
  static readAll(context) {
    return Object.values(context.replies)
      .map((reply) => new Consent(reply, context))
      .filter((consent) => !consent.invalid)
      .filter((consent) => !consent.patient_uuid)
  }

  /**
   * Link consent with patient record
   *
   * @param {import('./patient.js').Patient} patient - Patient
   * @param {object} context - Context
   */
  linkToPatient(patient, context) {
    // Link consent to patient, and patient to consent
    this.patient_uuid = patient.uuid
    patient.addReply(this)

    // Remove context to prevent circular dependencies
    delete this.context
    delete patient.context

    // Update context with updated values
    context.replies[this.uuid] = this
    context.patients[patient.uuid] = patient
  }
}
