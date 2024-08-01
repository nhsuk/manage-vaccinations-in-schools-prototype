import { fakerEN_GB as faker } from '@faker-js/faker'

/**
 * @class Organisation
 * @property {string} [code] - ODS code
 * @property {string} [name] - Full name
 * @property {string} [email] - Email address
 * @property {string} [tel] - Phone number
 * @function ns - Namespace
 * @function uri - URL
 */
export class Organisation {
  constructor(options) {
    this.code = options?.code
    this.name = options?.name
    this.email = options?.email
    this.tel = options?.tel
  }

  static generate() {
    const code = faker.helpers.replaceSymbols('???')
    const name = `${faker.location.county()} Child Immunisation Service`

    return new Organisation({
      code,
      name,
      email: faker.internet
        .email({
          firstName: code,
          lastName: 'sais',
          provider: 'example.nhs.net'
        })
        .toLowerCase(),
      tel: '01### ######'.replace(/#+/g, (m) => faker.string.numeric(m.length))
    })
  }

  get ns() {
    return 'organisation'
  }

  get uri() {
    return `/organisation/${this.code}`
  }
}
