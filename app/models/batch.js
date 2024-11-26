import { fakerEN_GB as faker } from '@faker-js/faker'

import vaccines from '../datasets/vaccines.js'
import {
  addDays,
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  getToday
} from '../utils/date.js'
import { formatMonospace } from '../utils/string.js'

import { Vaccine } from './vaccine.js'

/**
 * @class Batch
 * @property {string} id - Batch ID
 * @property {string} [created] - Created date
 * @property {string} expiry - Expiry date
 * @property {object} [expiry_] - Expiry date (from `dateInput`)
 * @property {string} vaccine_gtin - Vaccine GTIN
 */
export class Batch {
  constructor(options) {
    this.id = options?.id || faker.helpers.replaceSymbols('??####')
    this.created = options?.created || getToday().toISOString()
    this.expiry = options.expiry
    this.expiry_ = options?.expiry_
    this.vaccine_gtin = options.vaccine_gtin
  }

  /**
   * Generate fake batch
   *
   * @param {string} [vaccine_gtin] - Vaccine GTIN
   * @returns {Batch} - Batch
   * @static
   */
  static generate(vaccine_gtin) {
    const created = faker.date.recent({ days: 30 })
    const expiry = addDays(created, 120)
    vaccine_gtin =
      vaccine_gtin || faker.helpers.arrayElement(Object.keys(vaccines))

    return new Batch({
      created,
      expiry,
      vaccine_gtin
    })
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
   * Get vaccine this batch belongs to
   *
   * @returns {Vaccine} - Vaccine
   */
  get vaccine() {
    return new Vaccine(vaccines[this.vaccine_gtin])
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    const created = formatDate(this.created, { dateStyle: 'long' })
    const expiry = formatDate(this.expiry, { dateStyle: 'long' })
    const id = formatMonospace(this.id)

    return { created, expiry, id }
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
