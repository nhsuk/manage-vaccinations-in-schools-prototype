import { fakerEN_GB as faker } from '@faker-js/faker'

/**
 * @class Clinic
 * @property {string} id - Organisation code
 * @property {string} [name] - Name
 * @property {string} [addressLine1] - Address line 1
 * @property {string} [addressLine2] - Address line 2
 * @property {string} [addressLevel1] - Address level 1
 * @property {string} postalCode - Postcode
 */
export class Clinic {
  constructor(options) {
    this.id = options?.id || faker.helpers.replaceSymbols('?#####')
    this.name = options?.name
    this.addressLine1 = options?.addressLine1
    this.addressLine2 = options?.addressLine2
    this.addressLevel1 = options?.addressLevel1
    this.postalCode = options?.postalCode
  }

  /**
   * Get location
   * @returns {object} - Location
   */
  get location() {
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
      </span>`
    }
  }

  /**
   * Get formatted links
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      location: `<span>${this.name}</br>
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
    return 'clinics'
  }
}
