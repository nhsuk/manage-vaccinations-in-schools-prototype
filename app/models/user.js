import { fakerEN_GB as faker } from '@faker-js/faker'

/**
 * @class User
 * @property {string} uid - User ID
 * @property {string} firstName - First/given name
 * @property {string} lastName - Last/family name
 * @property {string} email - Email address
 * @property {boolean} admin - Has admin user role
 * @property {object} batch - Default batches
 * @function fullName - Get full name
 * @function ns - Namespace
 * @function uri - URL
 */
export class User {
  constructor(options) {
    this.uid = options?.uid || faker.string.numeric(12)
    this.firstName = options.firstName
    this.lastName = options.lastName
    this.email = options.email
    this.admin = options?.admin
    this.batch = options?.batch || {}
  }

  static generate() {
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
        .toLowerCase()
    })
  }

  get fullName() {
    return [this.firstName, this.lastName].join(' ')
  }

  get ns() {
    return 'user'
  }

  get uri() {
    return `/users/${this.uid}`
  }
}
