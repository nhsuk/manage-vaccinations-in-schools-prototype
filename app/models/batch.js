import { fakerEN_GB as faker } from '@faker-js/faker'

import { BatchPresenter } from '../presenters/batch.js'
import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  today
} from '../utils/date.js'

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
 * @property {string} [vaccine_snomed] - Vaccine SNOMED code
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
    this.vaccine_snomed = options?.vaccine_snomed
  }

  /**
   * Get expiry date for `dateInput`
   *
   * @returns {object|undefined} `dateInput` object
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
   * Get vaccine this batch belongs to
   *
   * @returns {Vaccine} Vaccine
   */
  get vaccine() {
    try {
      const vaccine = this.context?.vaccines[this.vaccine_snomed]
      if (vaccine) {
        return new Vaccine(vaccine)
      }
    } catch (error) {
      console.error('Batch.vaccine', error.message)
    }
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/vaccines/${this.vaccine_snomed}/batches/${this.id}`
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
    if (context?.batches?.[id]) {
      return new Batch(context.batches[id], context)
    }
  }

  /**
   * Show all
   *
   * @param {object} context - Context
   * @returns {Array<BatchPresenter>|undefined} Batch
   * @static
   */
  static showAll(context) {
    return Object.values(context.batches).map((batch) => {
      batch = new Batch(batch)

      return new BatchPresenter(batch)
    })
  }

  /**
   * Show
   *
   * @param {string} id - Batch ID
   * @param {object} context - Context
   * @returns {BatchPresenter|undefined} Batch
   * @static
   */
  static show(id, context) {
    const batch = Batch.read(id, context)

    return new BatchPresenter(batch)
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
