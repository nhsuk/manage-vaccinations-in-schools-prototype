import { fakerEN_GB as faker } from '@faker-js/faker'

import { Organisation } from '../models/organisation.js'

/**
 * Generate fake organisation
 *
 * @returns {Organisation} - Organisation
 */
export function generateOrganisation() {
  const code = faker.helpers.replaceSymbols('???')

  return new Organisation({
    code,
    name: `${faker.location.county()} Child Immunisation Service`,
    email: faker.internet
      .email({
        firstName: code,
        lastName: 'sais',
        provider: 'example.nhs.net'
      })
      .toLowerCase(),
    tel: '01### ######'.replace(/#+/g, (m) => faker.string.numeric(m.length)),
    password: faker.internet.password({
      memorable: true,
      length: 16
    })
  })
}
