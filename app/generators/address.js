import { fakerEN_GB as faker } from '@faker-js/faker'

import { Address } from '../models/address.js'

/**
 * Generate fake address
 *
 * @returns {Address} Address
 */
export function generateAddress() {
  return new Address({
    addressLine1: faker.location.streetAddress(),
    addressLevel1: faker.location.city(),
    postalCode: faker.location.zipCode({ format: 'CV## #??' })
  })
}
