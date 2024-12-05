import { fakerEN_GB as faker } from '@faker-js/faker'

import schoolsData from '../datasets/schools.js'
import { formatLink, formatMonospace } from '../utils/string.js'

import { Address } from './address.js'

export class SchoolPhase {
  static Primary = 'Primary'
  static Secondary = 'Secondary'
}

export class SchoolTerm {
  static Autumn = 'Autumn'
  static Spring = 'Spring'
  static Summer = 'Summer'
}

export const schoolTerms = {
  [SchoolTerm.Autumn]: { from: '2024-09-03', to: '2024-12-13' },
  [SchoolTerm.Spring]: { from: '2025-01-06', to: '2025-04-11' },
  [SchoolTerm.Summer]: { from: '2025-04-28', to: '2025-07-21' }
}

/**
 * @class School
 * @property {string} urn - URN
 * @property {string} name - Name
 * @property {SchoolPhase} [phase] - Phase
 * @property {Address} [address] - Address
 * @property {object} terms - Term dates
 */
export class School {
  constructor(options) {
    this.urn = (options.urn && Number(options.urn)) || faker.string.numeric(6)
    this.name = options?.name
    this.phase = options?.phase
    this.address = options?.address && new Address(options.address)
    this.terms = options?.terms || schoolTerms
  }

  /**
   * Generate school
   *
   * @param {number} urn - School URN
   * @returns {School} - School
   * @static
   */
  static generate(urn) {
    return new School({
      ...schoolsData[urn],
      address: schoolsData[urn]
    })
  }

  /**
   * Get location
   *
   * @returns {object} - Location
   */
  get location() {
    return {
      name: this.name,
      ...this.address
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      address: this.address?.formatted.multiline,
      location: Object.values(this.location)
        .filter((string) => string)
        .join(', '),
      nameAndAddress: this.address
        ? `<span>${this.name}</br><span class="nhsuk-u-secondary-text-color">${
            this.address.formatted.singleline
          }</span></span>`
        : this.name,
      urn: formatMonospace(this.urn)
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      name: formatLink(this.uri, this.name)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'school'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/schools/${this.urn}`
  }
}
