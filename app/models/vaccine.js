import { fakerEN_GB as faker } from '@faker-js/faker'

import { getDateValueDifference } from '../utils/date.js'
import {
  formatHealthQuestions,
  formatList,
  formatMillilitres,
  formatMonospace
} from '../utils/string.js'

import { Batch } from './batch.js'

/**
 * @readonly
 * @enum {string}
 */
export const VaccineSideEffect = {
  AppetiteLoss: 'loss of appetite',
  BlockedNose: 'a runny or blocked nose',
  Bruising: 'bruising or itching at the site of the injection',
  Dizzy: 'dizziness',
  Drowsy: 'feeling drowsy',
  Headache: 'a headache',
  Irritable: 'feeling irritable',
  PainArms: 'pain in the arms, hands, fingers',
  PainSite: 'pain, swelling or itchiness where the injection was given',
  Rash: 'a rash',
  Sick: 'feeling or being sick',
  SickFeeling: 'feeling sick (nausea)',
  Tiredness: 'general tiredness',
  Temperature: 'a high temperature',
  TemperatureShiver: 'a high temperature, or feeling hot and shivery',
  Unwell: 'generally feeling unwell'
}

/**
 * @readonly
 * @enum {string}
 */
export const PreScreenQuestion = {
  IsWell: 'are not acutely unwell',
  IsPregnant: 'are not pregnant',
  IsMedicated: 'are not taking any medication which prevents vaccination',
  IsAllergic: 'have no allergies which would prevent vaccination',
  IsVaccinated: 'have not already had this vaccination',
  IsHappy: 'know what the vaccination is for, and are happy to have it'
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
 * @property {string} snomed - SNOMED code
 * @property {string} type - Type
 * @property {string} brand - Brand
 * @property {string} manufacturer - Manufacturer
 * @property {object} [leaflet] - Leaflet
 * @property {number} dose - Dosage
 * @property {VaccineMethod} method - Method
 * @property {VaccinationProtocol} delegationProtocol - Delegation protocol
 * @property {Array<VaccineSideEffect>} sideEffects - Side effects
 * @property {object} healthQuestions - Health questions
 * @property {Array<PreScreenQuestion>} preScreenQuestions - Pre-screening questions
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
    this.method = options.method
    this.delegationProtocol = options.delegationProtocol
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
        .sort((a, b) => getDateValueDifference(a.expiry, b.expiry))
    } catch (error) {
      console.error('Vaccine.batches', error.message)
    }
  }

  /**
   * Get flattened health questions (moves sub-questions to top-level)
   *
   * @returns {object} - Health questions
   */
  get flatHealthQuestions() {
    return Object.fromEntries(
      Object.entries(this.healthQuestions).flatMap(([key, value]) => {
        if (value.conditional) {
          return [[key, {}], ...Object.entries(value.conditional)]
        }

        return [[key, value]]
      })
    )
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      snomed: formatMonospace(this.snomed),
      healthQuestions: formatHealthQuestions(this.healthQuestions),
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
    if (context?.vaccines?.[snomed]) {
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
