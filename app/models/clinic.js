import { fakerEN_GB as faker } from '@faker-js/faker'

import { Address } from './address.js'

/**
 * @class Clinic
 * @property {string} id - Organisation code
 * @property {string} [name] - Name
 * @property {Address} [address] - Address
 */
export class Clinic {
  constructor(options) {
    this.id = options?.id || faker.helpers.replaceSymbols('?#####')
    this.name = options?.name
    this.address = options?.address && new Address(options.address)
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
        : this.name
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'clinic'
  }
}
