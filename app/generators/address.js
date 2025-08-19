import { fakerEN_GB as faker } from '@faker-js/faker'

/**
 * Generate fake address
 *
 * @returns {object} Address
 */
export function generateAddress() {
  return {
    addressLine1: faker.location.streetAddress(),
    addressLevel1: faker.location.city(),
    postalCode: faker.location.zipCode({ format: 'CV## #??' })
  }
}
