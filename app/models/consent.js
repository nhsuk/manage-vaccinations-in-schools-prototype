import vaccines from '../datasets/vaccines.js'
import { hasAnswersNeedingTriage } from '../utils/reply.js'
import { formatLinkWithSecondaryText } from '../utils/string.js'

import { ProgrammeType } from './programme.js'
import { Reply, ReplyDecision } from './reply.js'
import { VaccineMethod } from './vaccine.js'

/**
 * @class Consent
 * @augments Reply
 */
export class Consent extends Reply {
  /**
   * Get health questions to show based on programme and decision given
   *
   * @returns {Map} - Health questions
   */
  get healthQuestionsForDecision() {
    const { Flu, HPV, MenACWY, TdIPV } = ProgrammeType
    const { Injection, Nasal } = VaccineMethod
    const programme = this.session.primaryProgrammes[0]

    const healthQuestionsForDecision = new Map()
    let consentedMethod
    let consentedVaccine

    // Consent given for flu programme with method of vaccination
    if (programme.type === Flu) {
      consentedMethod =
        this.decision === ReplyDecision.OnlyFluInjection ? Injection : Nasal
      consentedVaccine = Object.values(vaccines).find(
        (programme) =>
          programme.type === Flu && programme.method === consentedMethod
      )
    }

    // Consent given for HPV programme
    if (programme.type === HPV) {
      consentedVaccine = Object.values(vaccines).find(
        (programme) => programme.type === HPV
      )
    }

    // Consent given for MenACWY programme only
    if (this.decision === ReplyDecision.OnlyMenACWY) {
      consentedVaccine = Object.values(vaccines).find(
        (programme) => programme.type === MenACWY
      )
    }

    // Consent given for Td/IPV programme only
    if (this.decision === ReplyDecision.OnlyTdIPV) {
      consentedVaccine = Object.values(vaccines).find(
        (programme) => programme.type === TdIPV
      )
    }

    // Consent given for all programmes
    if (ReplyDecision.Given && !consentedVaccine) {
      consentedVaccine = this.session.vaccines
    }

    const consentedVaccines = Array.isArray(consentedVaccine)
      ? consentedVaccine
      : [consentedVaccine]
    for (const vaccine of consentedVaccines) {
      for (const [key, value] of Object.entries(vaccine.healthQuestions)) {
        healthQuestionsForDecision.set(key, value)
      }
    }

    // Always ask support question last
    healthQuestionsForDecision.set('support', {})

    return healthQuestionsForDecision
  }

  /**
   * Answers in this consent response need triage
   *
   * @returns {boolean} - Answers need triage
   */
  get hasAnswersNeedingTriage() {
    return hasAnswersNeedingTriage(this.healthAnswers)
  }

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
