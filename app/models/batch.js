import { fakerEN_GB as faker } from '@faker-js/faker'
import { isBefore } from 'date-fns'

import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  today
} from '../utils/date.js'
import { formatMonospace } from '../utils/string.js'

import { Vaccine } from './vaccine.js'

/**
 * @class Batch
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} id - Batch ID
 * @property {Date} [createdAt] - Created date
 * @property {Date} [updatedAt] - Updated date
 * @property {Date} [archivedAt] - Archived date
 * @property {Date} [expiry] - Expiry date
 * @property {object} [expiry_] - Expiry date (from `dateInput`)
 * @property {string} [vaccine_gtin] - Vaccine GTIN
 */
export class Batch {
  constructor(options, context) {
    this.context = context
    this.id = options?.id || faker.helpers.replaceSymbols('??####')
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.updatedAt = options?.updatedAt && new Date(options.updatedAt)
    this.archivedAt = options?.archivedAt && new Date(options.archivedAt)
    this.expiry = options?.expiry ? new Date(options.expiry) : undefined
    this.expiry_ = options?.expiry_
    this.vaccine_gtin = options?.vaccine_gtin
  }

  /**
   * Get expiry date for `dateInput`
   *
   * @returns {object|undefined} - `dateInput` object
   */
  get expiry_() {
    return convertIsoDateToObject(this.expiry)
  }

  /**
   * Set expiry date from `dateInput`
   *
   * @param {object} object - dateInput object
   */
  set expiry_(object) {
    if (object) {
      this.expiry = convertObjectToIsoDate(object)
    }
  }

  /**
   * Get name
   *
   * @returns {string} - Name
   */
  get name() {
    return `${this.formatted.id} (${this.formatted.expiry})`
  }

  /**
   * Get summary (name and expiry)
   *
   * @returns {string} - Name
   */
  get summary() {
    const prefix = isBefore(this.archivedAt, today()) ? 'Expired' : 'Expires'

    return `${this.formatted.id}<br>\n<span class="nhsuk-u-secondary-text-color">${prefix} ${this.formatted.expiry}</span>`
  }

  /**
   * Get vaccine this batch belongs to
   *
   * @returns {Vaccine} - Vaccine
   */
  get vaccine() {
    try {
      const vaccine = this.context?.vaccines[this.vaccine_gtin]
      if (vaccine) {
        return new Vaccine(vaccine)
      }
    } catch (error) {
      console.error('Batch.vaccine', error.message)
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    const createdAt = formatDate(this.createdAt, { dateStyle: 'long' })
    const updatedAt = formatDate(this.updatedAt, { dateStyle: 'long' })
    const expiry = formatDate(this.expiry, { dateStyle: 'long' })
    const id = formatMonospace(this.id)

    return { createdAt, updatedAt, expiry, id }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'batch'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/vaccines/${this.vaccine_gtin}/batches/${this.id}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Batch>|undefined} Batches
   * @static
   */
  static readAll(context) {
    return Object.values(context.batches).map(
      (batch) => new Batch(batch, context)
    )
  }

  /**
   * Read
   *
   * @param {string} id - Batch ID
   * @param {object} context - Context
   * @returns {Batch|undefined} Batch
   * @static
   */
  static read(id, context) {
    if (context?.batches) {
      return new Batch(context.batches[id], context)
    }
  }

  /**
   * Create
   *
   * @param {Batch} batch - Batch
   * @param {object} context - Context
   */
  create(batch, context) {
    batch = new Batch(batch)

    // Update context
    context.batches[batch.id] = batch
  }

  /**
   * Archive
   *
   * @param {object} context - Context
   */
  archive(context) {
    this.archivedAt = new Date()

    // Remove batch context
    delete this.context

    // Update context
    context.batches[this.id] = this
  }

  /**
   * Update
   *
   * @param {object} updates - Updates
   * @param {object} context - Context
   */
  update(updates, context) {
    this.updatedAt = new Date()

    // Remove batch context
    delete this.context

    // Delete original batch (with previous ID)
    delete context.batches[this.id]

    // Update context
    const updatedBatch = Object.assign(this, updates)
    context.batches[updatedBatch.id] = updatedBatch
  }
}
