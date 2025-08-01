import { hasAnswersNeedingTriage } from '../utils/reply.js'
import { formatLinkWithSecondaryText } from '../utils/string.js'

import { Reply } from './reply.js'

/**
 * @class Consent
 * @augments Reply
 */
export class Consent extends Reply {
  /**
   * Answers in this consent response need triage
   *
   * @returns {boolean} Answers need triage
   */
  get hasAnswersNeedingTriage() {
    return hasAnswersNeedingTriage(this.healthAnswers)
  }

  /**
   * Get formatted links
   *
   * @returns {object} Formatted links
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
   * @returns {string} Namespace
   */
  get ns() {
    return 'consent'
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/consents/${this.uuid}`
  }

  /**
   * Get parent form URI
   *
   * @returns {string} Parent form URI
   */
  get parentUri() {
    return `${this.session.consentUrl}/${this.uuid}`
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
      .map((reply) => new Consent(reply, context))
      .filter((consent) => !consent.invalid)
      .filter((consent) => !consent.patient_uuid)
  }

  /**
   * Read
   *
   * @param {string} uuid - Reply UUID
   * @param {object} context - Context
   * @returns {Consent|undefined} Consent
   * @static
   */
  static read(uuid, context) {
    if (context?.replies?.[uuid]) {
      return new Consent(context.replies[uuid], context)
    }
  }

  /**
   * Link consent with patient record
   *
   * @param {import('./patient.js').Patient} patient - Patient
   */
  linkToPatient(patient) {
    this.patient_uuid = patient.uuid
    patient.addReply(this)
  }
}
