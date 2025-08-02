import { isBefore } from 'date-fns'

import { en } from '../locales/en.js'
import { formatDate, today } from '../utils/date.js'
import { formatMonospace, formatWithSecondaryText } from '../utils/string.js'

/**
 * @typedef {import('../models/batch.js').Batch} Batch
 */

/**
 * @class BatchPresenter
 * @augments {Batch}
 * @property {Batch} batch - Batch
 */
export class BatchPresenter {
  #batch

  constructor(batch) {
    this.#batch = batch

    this.id = batch.id
    this.uri = batch.uri
    this.createdAt = batch.createdAt
    this.updatedAt = batch.updatedAt
    this.archivedAt = batch.archivedAt
    this.expiry_ = batch.expiry_
    this.vaccine = batch.vaccine

    this.update = batch.update
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
