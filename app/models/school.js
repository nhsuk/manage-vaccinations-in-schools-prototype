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
 * @property {SchoolPhase} phase - Phase
 * @property {string} addressLine1 - Address line 1
 * @property {string} addressLine2 - Address line 2
 * @property {string} addressLevel1 - Address level 1
 * @property {string} postalCode - Postcode
 * @function ns - Namespace
 * @function uri - URL
 */
export class School {
  constructor(options) {
    this.urn = (options.urn && Number(options.urn)) || faker.string.numeric(6)
    this.name = options?.name
    this.phase = options?.phase
    this.addressLine1 = options.addressLine1
    this.addressLine2 = options.addressLine2
    this.addressLevel1 = options.addressLevel1
    this.postalCode = options.postalCode
  }

  get location() {
    return {
      name: this.name,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      addressLevel1: this.addressLevel1,
      postalCode: this.postalCode
    }
  }

  get formatted() {
    return {
      address: `${this.addressLine1}, ${this.addressLevel1}. ${this.postalCode}`,
      urn: formatMonospace(this.urn)
    }
  }

  get summary() {
    return {
      location: `${this.location.name}</br>
      <span class="nhsuk-u-secondary-text-color">${this.formatted.address}</span>`
    }
  }

  get link() {
    return {
      name: formatLink(this.uri, this.name)
    }
  }

  get ns() {
    return 'school'
  }

  get uri() {
    return `/schools/${this.urn}`
  }
}
