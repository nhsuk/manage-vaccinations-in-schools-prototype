import { en } from '../locales/en.js'
import { Vaccine } from '../models/vaccine.js'
import { getSummaryRow } from '../utils/presenter.js'
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
   * @returns {Array<VaccinePresenter>|undefined} Vaccines
   * @static
   */
  static forAll(context) {
    const vaccines = Vaccine.findAll(context)

    return Object.values(vaccines).map(
      (vaccine) => new VaccinePresenter(vaccine, context)
    )
  }

  /**
   * Get formatted SNOMED code
   *
   * @returns {string} Formatted SNOMED code
   */
  get snomed() {
    return formatMonospace(this.#vaccine.snomed)
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
   * Get formatted dose
   *
   * @returns {string} Formatted dose
   */
  get dose() {
    return formatMillilitres(this.#vaccine.dose)
  }

  /**
   * Get formatted health questions
   *
   * @returns {string} Formatted health questions
   */
  get healthQuestions() {
    return formatHealthQuestions(this.#vaccine.healthQuestions)
  }

  /**
   * Get formatted pre-screen questions
   *
   * @returns {string} Formatted pre-screen questions
   */
  get preScreenQuestions() {
    return formatList(this.#vaccine.preScreenQuestions)
  }

  /**
   * Get formatted side effects
   *
   * @returns {string} Formatted side effects
   */
  get sideEffects() {
    return formatList(this.#vaccine.sideEffects)
  }

  /**
   * Get summary rows for display in templates
   *
   * @param {object} fields - Fields to include
   * @returns {Array} Summary rows
   */
  getSummaryRows(fields = {}) {
    const rows = []

    for (const fieldName of Object.keys(fields)) {
      if (fields[fieldName]) {
        rows.push(
          getSummaryRow({
            key: en.vaccine[fieldName].label,
            value: this[fieldName] || this.#vaccine[fieldName]
          })
        )
      }
    }

    rows.at(-1).classes = 'nhsuk-summary-list__row--no-border'

    return rows
  }
}
