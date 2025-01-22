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
    return `/consents/${this.uuid}`
  }

  /**
   * Get parent form URI
   *
   * @returns {string} - Parent form URI
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
    if (context?.replies) {
      return new Consent(context.replies[uuid], context)
    }
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
