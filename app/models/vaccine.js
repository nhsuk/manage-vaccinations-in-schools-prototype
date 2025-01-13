import { fakerEN_GB as faker } from '@faker-js/faker'

import vaccines from '../datasets/vaccines.js'
import {
  formatList,
  formatMillilitres,
  formatMonospace
} from '../utils/string.js'

import { Batch } from './batch.js'

/**
 * @readonly
 * @enum {string}
 */
export const HealthQuestion = {
  Aspirin: 'Does the child take regular aspirin?',
  Allergy: 'Does the child have any severe allergies?',
  Asthma: 'Has the child been diagnosed with asthma?',
  AsthmaAdmitted:
    'Has the child been admitted to intensive care for their asthma?',
  AsthmaSteroids:
    'Has the child taken any oral steroids for their asthma in the last 2 weeks?',
  EggAllergy:
    'Has the child ever been admitted to intensive care due an allergic reaction to egg?',
  Immunosuppressant: 'Does the child take any immunosuppressant medication?',
  ImmuneSystem:
    'Does the child have a disease or treatment that severely affects their immune system?',
  HouseholdImmuneSystem:
    'Is anyone in the child’s household currently having treatment that severely affects their immune system?',
  MedicationAllergies: 'Does the child have any allergies to medication?',
  MedicalConditions:
    'Does the child have any medical conditions for which they receive treatment?',
  PreviousReaction:
    'Has the child ever had a severe reaction to any medicines, including vaccines?',
  RecentFluVaccination:
    'Has the child had a flu vaccination in the last 5 months?',
  Support: 'Does the child need extra support during vaccination sessions?'
}

/**
 * @readonly
 * @enum {string}
 */
export const PreScreenQuestion = {
  isAllergic:
    'Has the child confirmed they have no allergies which would prevent vaccination?',
  isPregnant: 'Has the child confirmed they’re not pregnant?',
  isMedicated:
    'Has the child confirmed they’re not taking any medication which prevents vaccination?',
  isVaccinated:
    'Has the child confirmed they have not already had this vaccination?',
  isWell: 'Is the child is feeling well?',
  isHappy:
    'Does the child know what the vaccination is for, and are they happy to have it?'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccineMethod = {
  Nasal: 'Nasal spray',
  Injection: 'Injection'
}

/**
 * @class Vaccine
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} gtin - GTIN
 * @property {string} type - Type
 * @property {string} brand - Brand
 * @property {string} manufacturer - Manufacturer
 * @property {number} dose - Dosage
 * @property {number} sequenceLimit - Maximum doses in sequence
 * @property {VaccineMethod} method - Method
 * @property {Array<string>} healthQuestionKeys - Health question keys
 * @property {Array<string>} preScreenQuestionKeys - Pre-screening question keys
 */
export class Vaccine {
  constructor(options, context) {
    this.context = context
    this.gtin = options?.gtin || faker.string.numeric(14)
    this.type = options.type
    this.brand = options.brand
    this.manufacturer = options.manufacturer
    this.dose = options.dose
    this.sequenceLimit = options.sequenceLimit
    this.method = options.method
    this.healthQuestionKeys = options.healthQuestionKeys
    this.preScreenQuestionKeys = options.preScreenQuestionKeys
  }

  /**
   * Get brand with vaccine type
   *
   * @returns {string} - Brand with vaccine type
   */
  get brandWithType() {
    return `${this.brand} (${this.type})`
  }

  /**
   * Get health questions
   *
   * @returns {Array} - Health questions
   */
  get healthQuestions() {
    return vaccines[this.gtin].healthQuestionKeys.map(
      (key) => HealthQuestion[key]
    )
  }

  /**
   * Get pre-screening questions
   *
   * @returns {Array} - Pre-screening questions
   */
  get preScreenQuestions() {
    return vaccines[this.gtin].preScreenQuestionKeys.map(
      (key) => PreScreenQuestion[key]
    )
  }

  /**
   * Get vaccine batches
   *
   * @returns {Array<Batch>} - Batches
   */
  get batches() {
    try {
      return Object.values(this.context.batches)
        .filter((batch) => batch.vaccine_gtin === this.gtin)
        .map((batch) => new Batch(batch))
    } catch (error) {
      console.error('Vaccine.batches', error.message)
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      gtin: formatMonospace(this.gtin),
      healthQuestions: formatList(this.healthQuestions),
      preScreenQuestions: formatList(this.preScreenQuestions),
      dose: formatMillilitres(this.dose)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'vaccine'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/vaccines/${this.gtin}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Vaccine>|undefined} Vaccines
   * @static
   */
  static readAll(context) {
    return Object.values(context.vaccines).map(
      (vaccine) => new Vaccine(vaccine, context)
    )
  }

  /**
   * Read
   *
   * @param {string} gtin - GTIN
   * @param {object} context - Context
   * @returns {Vaccine|undefined} Vaccine
   * @static
   */
  static read(gtin, context) {
    if (context?.vaccines) {
      return new Vaccine(context.vaccines[gtin], context)
    }
  }

  /**
   * Delete
   *
   * @param {object} context - Context
   */
  delete(context) {
    delete context.vaccines[this.gtin]
  }
}
