import { fakerEN_GB as faker } from '@faker-js/faker'

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
export const VaccineMethod = {
  Nasal: 'Nasal spray',
  Injection: 'Injection'
}

/**
 * @class Vaccine
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} snomed - SNOMED code
 * @property {string} type - Type
 * @property {string} brand - Brand
 * @property {string} manufacturer - Manufacturer
 * @property {object} [leaflet] - Leaflet
 * @property {number} dose - Dosage
 * @property {number} sequenceLimit - Maximum doses in sequence
 * @property {VaccineMethod} method - Method
 * @property {Array<string>} sideEffects - Side effects
 * @property {Array<string>} healthQuestions - Health questions
 * @property {Array<string>} preScreenQuestions - Pre-screening questions
 */
export class Vaccine {
  constructor(options, context) {
    this.context = context
    this.snomed = options?.snomed || faker.string.numeric(14)
    this.type = options?.type
    this.brand = options.brand
    this.manufacturer = options.manufacturer
    this.leaflet = options.leaflet
    this.dose = options.dose
    this.sequenceLimit = options.sequenceLimit
    this.method = options.method
    this.sideEffects = options.sideEffects
    this.healthQuestions = options.healthQuestions
    this.preScreenQuestions = options.preScreenQuestions
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
   * Get vaccine batches
   *
   * @returns {Array<Batch>} - Batches
   */
  get batches() {
    try {
      return Object.values(this.context.batches)
        .filter((batch) => batch.vaccine_snomed === this.snomed)
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
      snomed: formatMonospace(this.snomed),
      healthQuestions: formatList(this.healthQuestions),
      preScreenQuestions: formatList(this.preScreenQuestions),
      sideEffects: formatList(this.sideEffects),
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
    return `/vaccines/${this.snomed}`
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
   * @param {string} snomed - SNOMED code
   * @param {object} context - Context
   * @returns {Vaccine|undefined} Vaccine
   * @static
   */
  static read(snomed, context) {
    if (context?.vaccines) {
      return new Vaccine(context.vaccines[snomed], context)
    }
  }

  /**
   * Delete
   *
   * @param {object} context - Context
   */
  delete(context) {
    delete context.vaccines[this.snomed]
  }
}
