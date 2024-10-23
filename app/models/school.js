import { fakerEN_GB as faker } from '@faker-js/faker'
import { formatLink, formatMonospace } from '../utils/string.js'

export class SchoolPhase {
  static Primary = 'Primary'
  static Secondary = 'Secondary'
}

/**
 * @class School
 * @property {string} urn - URN
 * @property {string} name - Name
 * @property {SchoolPhase} [phase] - Phase
 * @property {string} [addressLine1] - Address line 1
 * @property {string} [addressLine2] - Address line 2
 * @property {string} [addressLevel2] - Address level 2
 * @property {string} [postalCode] - Postcode
 */
export class School {
  constructor(options) {
    this.urn = (options.urn && Number(options.urn)) || faker.string.numeric(6)
    this.name = options?.name
    this.phase = options?.phase
    this.addressLine1 = options?.addressLine1
    this.addressLine2 = options?.addressLine2
    this.addressLevel1 = options?.addressLevel1
    this.postalCode = options?.postalCode
  }

  /**
   * Get location
   * @returns {object|undefined} - Location
   */
  get location() {
    if (!this.postalCode) {
      return
    }

    return {
      name: this.name,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      addressLevel1: this.addressLevel1,
      postalCode: this.postalCode
    }
  }

  /**
   * Get formatted values
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      address: `${this.addressLine1}, ${this.addressLevel1}. ${this.postalCode}`,
      location: `<span>${this.name}</br>
        <span class="nhsuk-u-secondary-text-color">
          ${this.addressLine1},
          ${this.addressLevel1},
          ${this.postalCode}
        </span>
      </span>`,
      urn: formatMonospace(this.urn)
    }
  }

  /**
   * Get formatted links
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      name: formatLink(this.uri, this.name),
      location: `<span>${formatLink(this.uri, this.name)}</br>
        <span class="nhsuk-u-secondary-text-color">
          ${this.addressLine1},
          ${this.addressLevel1},
          ${this.postalCode}
        </span>
      </span>`
    }
  }

  /**
   * Get namespace
   * @returns {string} - Namespace
   */
  get ns() {
    return 'school'
  }

  /**
   * Get URI
   * @returns {string} - URI
   */
  get uri() {
    return `/schools/${this.urn}`
  }
}
