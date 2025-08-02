import { en } from '../locales/en.js'
import { Vaccine } from '../models/vaccine.js'
import {
  formatHealthQuestions,
  formatList,
  formatMillilitres,
  formatMonospace
} from '../utils/string.js'

/**
 * @class VaccinePresenter
 * @param {Vaccine} vaccine - Vaccine
 * @param {object} [context] - Context
 */
export class VaccinePresenter {
  #vaccine
  #context

  constructor(vaccine, context) {
    this.#vaccine = vaccine
    this.#context = context

    this.snomed = vaccine.snomed
    this.uri = vaccine.uri
    this.brand = vaccine.brand
    this.type = vaccine.type
    this.batches = vaccine.batches
  }

  /**
   * Present vaccine
   *
   * @param {string} snomed - SNOMED code
   * @param {object} context - Context
   * @returns {VaccinePresenter|undefined} Vaccine
   * @static
   */
  static forOne(snomed, context) {
    const vaccine = Vaccine.findOne(snomed, context)

    return new VaccinePresenter(vaccine, context)
  }

  /**
   * Present vaccines
   *
   * @param {object} context - Context
   * @returns {Array<VaccinePresenter>|undefined} Vaccine
   * @static
   */
  static forAll(context) {
    const vaccines = Vaccine.findAll(context)

    return Object.values(vaccines).map(
      (vaccine) => new VaccinePresenter(vaccine, context)
    )
  }

  /**
   * Get brand with vaccine type
   *
   * @returns {string} Brand with vaccine type
   */
  get brandWithType() {
    return `${this.#vaccine.brand} (${this.#vaccine.type})`
  }

  /**
   * Get formatted values
   *
   * @returns {object} Formatted values
   */
  get formatted() {
    return {
      preScreenQuestions: formatList(this.#vaccine.preScreenQuestions),
      sideEffects: formatList(this.#vaccine.sideEffects)
    }
  }

  /**
   * Get summary rows for display in templates
   *
   * @param {object} fields - Fields to include
   * @returns {Array} - Summary rows
   */
  getSummaryRows(fields = {}) {
    const rows = []

    if (fields.snomed) {
      rows.push({
        key: { text: en.vaccine.snomed.label },
        value: { html: formatMonospace(this.#vaccine.snomed) },
        ...fields.snomed
      })
    }

    if (fields.manufacturer) {
      rows.push({
        key: { text: en.vaccine.manufacturer.label },
        value: { text: this.#vaccine.manufacturer },
        ...fields.manufacturer
      })
    }

    if (fields.type) {
      rows.push({
        key: { text: en.vaccine.type.label },
        value: { text: this.#vaccine.type },
        ...fields.type
      })
    }

    if (fields.dose) {
      rows.push({
        key: { text: en.vaccine.dose.label },
        value: { html: formatMillilitres(this.#vaccine.dose) },
        ...fields.dose
      })
    }

    if (fields.method) {
      rows.push({
        key: { text: en.vaccine.method.label },
        value: { text: this.#vaccine.method },
        ...fields.method
      })
    }

    if (fields.healthQuestions) {
      rows.push({
        key: { text: en.vaccine.healthQuestions.label },
        value: { html: formatHealthQuestions(this.#vaccine.healthQuestions) },
        ...fields.healthQuestions
      })
    }

    if (fields.preScreenQuestions) {
      rows.push({
        key: { text: en.vaccine.preScreenQuestions.label },
        value: { html: formatList(this.#vaccine.preScreenQuestions) },
        ...fields.healthQuestions
      })
    }

    if (fields.sideEffects) {
      rows.push({
        key: { text: en.vaccine.sideEffects.label },
        value: { html: formatList(this.#vaccine.sideEffects) },
        ...fields.sideEffects
      })
    }

    rows.at(-1).classes = 'nhsuk-summary-list__row--no-border'

    return rows
  }
}
