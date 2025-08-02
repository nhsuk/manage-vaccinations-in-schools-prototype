import { isBefore } from 'date-fns'

import { en } from '../locales/en.js'
import { Batch } from '../models/batch.js'
import { formatDate, today } from '../utils/date.js'
import { formatMonospace, formatWithSecondaryText } from '../utils/string.js'

import { VaccinePresenter } from './vaccine.js'

/**
 * @class BatchPresenter
 * @param {Batch} batch - Batch
 * @param {object} [context] - Context
 */
export class BatchPresenter {
  #batch
  #context

  constructor(batch, context) {
    this.#batch = batch
    this.#context = context

    this.id = batch.id
    this.uri = batch.uri
    this.createdAt = batch.createdAt
    this.updatedAt = batch.updatedAt
    this.archivedAt = batch.archivedAt
    this.expiry_ = batch.expiry_
    this.vaccine_snomed = batch.vaccine_snomed
  }

  /**
   * Present batch
   *
   * @param {string} id - Batch ID
   * @param {object} context - Context
   * @returns {BatchPresenter|undefined} Batch
   * @static
   */
  static forOne(id, context) {
    const batch = Batch.findOne(id, context)

    return new BatchPresenter(batch, context)
  }

  /**
   * Present batches
   *
   * @param {object} context - Context
   * @returns {Array<BatchPresenter>|undefined} Batch
   * @static
   */
  static forAll(context) {
    const batches = Batch.findAll(context)

    return Object.values(batches).map(
      (batch) => new BatchPresenter(batch, context)
    )
  }

  /**
   * Get formatted ID
   *
   * @returns {string} string - Formatted ID
   */
  get formattedId() {
    return formatMonospace(this.#batch.id)
  }

  /**
   * Get formatted created date
   *
   * @returns {string} string - Formatted created date
   */
  get formattedCreatedAt() {
    return formatDate(this.#batch.createdAt, { dateStyle: 'long' })
  }

  /**
   * Get formatted expiry date
   *
   * @returns {string} string - Formatted expiry date
   */
  get formattedExpiry() {
    return formatDate(this.#batch.expiry, { dateStyle: 'long' })
  }

  /**
   * Get name
   *
   * @returns {string} Name
   */
  get name() {
    return `${this.formattedId} (${this.formattedExpiry})`
  }

  /**
   * Get vaccine this batch belongs to
   *
   * @returns {VaccinePresenter} Vaccine
   */
  get vaccine() {
    return this.#batch?.vaccine_snomed
      ? VaccinePresenter.forOne(this.#batch.vaccine_snomed, this.#context)
      : null
  }

  /**
   * Get summary (name and expiry)
   *
   * @returns {string} Name
   */
  get summaryRowHtml() {
    const prefix = isBefore(this.archivedAt, today()) ? 'Expired' : 'Expires'

    return formatWithSecondaryText(
      this.formattedId,
      `${prefix} ${this.formattedExpiry}`
    )
  }

  /**
   * Get table row for display in templates
   *
   * @returns {Array} - Table row cells
   */
  get tableRow() {
    return [
      {
        header: en.batch.id.label,
        html: this.formattedId
      },
      {
        header: en.batch.createdAt.label,
        html: this.#batch.createdAt ? this.formattedCreatedAt : 'Not provided'
      },
      {
        header: en.batch.expiry.label,
        html: this.#batch.expiry ? this.formattedExpiry : 'Not provided'
      }
    ]
  }
}
