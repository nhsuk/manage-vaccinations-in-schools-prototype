import { fakerEN_GB as faker } from '@faker-js/faker'

import { UserRole } from '../enums.js'
import { User } from '../models/user.js'

/**
 * Generate fake user
 *
 * @returns {User} User
 */
export function generateUser() {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()

  return new User({
    firstName,
    lastName,
    email: faker.internet
      .email({
        firstName,
        lastName,
        provider: 'example.nhs.net'
      })
      .toLowerCase(),
    role: faker.helpers.arrayElement(Object.values(UserRole))
  })
}
