import { fakerEN_GB as faker } from '@faker-js/faker'

/**
 * @class Address
 * @property {string} [addressLine1] - Address line 1
 * @property {string} [addressLine2] - Address line 2
 * @property {string} [addressLevel1] - Address level 1
 * @property {string} [postalCode] - Postcode
 */
export class Address {
  constructor(options) {
    this.addressLine1 = options?.addressLine1
    this.addressLine2 = options?.addressLine2
    this.addressLevel1 = options?.addressLevel1
    this.postalCode = options?.postalCode
  }

  /**
   * Generate fake address
   *
   * @returns {Address} - Address
   * @static
   */
  static generate() {
    return new Address({
      addressLine1: faker.location.streetAddress(),
      addressLevel1: faker.location.city(),
      postalCode: faker.location.zipCode({ format: 'CV## #??' })
    })
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      multiline: Object.values(this)
        .filter((string) => string)
        .join('<br>'),
      singleline: Object.values(this)
        .filter((string) => string)
        .join(', ')
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'address'
  }
}