import { fakerEN_GB as faker } from '@faker-js/faker'
import { isBefore } from 'date-fns'

import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  getToday
} from '../utils/date.js'
import { formatMonospace } from '../utils/string.js'

import { Vaccine } from './vaccine.js'

/**
 * @class Batch
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} id - Batch ID
 * @property {Date} [created] - Created date
 * @property {Date} [updated] - Updated date
 * @property {Date} [archived] - Archived date
 * @property {Date} [expiry] - Expiry date
 * @property {object} [expiry_] - Expiry date (from `dateInput`)
 * @property {string} [vaccine_gtin] - Vaccine GTIN
 */
export class Batch {
  constructor(options, context) {
    this.context = context
    this.id = options?.id || faker.helpers.replaceSymbols('??####')
    this.created = options?.created ? new Date(options.created) : getToday()
    this.updated = options?.updated ? new Date(options.updated) : undefined
    this.archived = options?.archived && new Date(options.archived)
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
    const prefix = isBefore(this.archived, getToday()) ? 'Expired' : 'Expires'

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
    const created = formatDate(this.created, { dateStyle: 'long' })
    const updated = formatDate(this.updated, { dateStyle: 'long' })
    const expiry = formatDate(this.expiry, { dateStyle: 'long' })
    const id = formatMonospace(this.id)

    return { created, updated, expiry, id }
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
    return `/vaccines/${this.vaccine_gtin}/${this.id}`
  }
}
