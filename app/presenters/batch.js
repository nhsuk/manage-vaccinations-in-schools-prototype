import { isBefore } from 'date-fns'

import { en } from '../locales/en.js'
import { Batch } from '../models/batch.js'
import { formatDate, today } from '../utils/date.js'
import { getTableCell } from '../utils/presenter.js'
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

    this.uri = batch.uri
    // TODO: id used for formatting, but id value needed for BatchItems
    this.batch_id = batch.id
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
   * @returns {Array<BatchPresenter>|undefined} Batches
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
   * @returns {string} Formatted ID
   */
  get id() {
    return formatMonospace(this.#batch.id)
  }

  /**
   * Get formatted created date
   *
   * @returns {string} Formatted created date
   */
  get createdAt() {
    return formatDate(this.#batch.createdAt, { dateStyle: 'long' })
  }

  /**
   * Get formatted expiry date
   *
   * @returns {string} Formatted expiry date
   */
  get expiry() {
    return formatDate(this.#batch.expiry, { dateStyle: 'long' })
  }

  /**
   * Get name
   *
   * @returns {string} Name
   */
  get name() {
    return `${this.id} (${this.expiry})`
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

    return formatWithSecondaryText(this.id, `${prefix} ${this.expiry}`)
  }

  /**
   * Get table row for display in templates
   *
   * @param {object} fields - Fields to include
   * @returns {Array} Table row cells
   */
  getTableRow(fields = {}) {
    const cells = []

    for (const fieldName of Object.keys(fields)) {
      if (fields[fieldName]) {
        cells.push(
          getTableCell({
            key: en.batch[fieldName].label,
            value: this[fieldName] || this.#batch[fieldName],
            href: fields[fieldName].href
          })
        )
      }
    }

    return cells
  }
}
