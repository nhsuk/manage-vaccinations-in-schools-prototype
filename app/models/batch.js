import { fakerEN_GB as faker } from '@faker-js/faker'
import vaccines from '../datasets/vaccines.js'
import {
  addDays,
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate
} from '../utils/date.js'
import { formatMonospace } from '../utils/string.js'

/**
 * @class Batch
 * @property {string} id - Batch ID
 * @property {string} created - Created date
 * @property {string} expires - Expiry date
 * @property {string} vaccine_gtin - Vaccine GTIN
 * @function vaccine - Vaccine
 * @function ns - Namespace
 * @function uri - URL
 */
export class Batch {
  constructor(options) {
    this.id = options?.id || faker.helpers.replaceSymbols('??####')
    this.created = options.created || new Date().toISOString()
    this.expires = options.expires
    this.vaccine_gtin = options.vaccine_gtin
    // dateInput objects
    this.expires_ = options?.expires_
  }

  static generate() {
    const created = faker.date.recent({ days: 30 })
    const expires = addDays(created, 120)

    return new Batch({
      created,
      expires,
      vaccine_gtin: faker.helpers.arrayElement(Object.keys(vaccines))
    })
  }

  get expires_() {
    return convertIsoDateToObject(this.expires)
  }

  set expires_(object) {
    if (object) {
      this.expires = convertObjectToIsoDate(object)
    }
  }

  get vaccine() {
    return vaccines[this.vaccine_gtin]
  }

  get formatted() {
    const created = formatDate(this.created, { dateStyle: 'long' })
    const expires = formatDate(this.expires, { dateStyle: 'long' })
    const id = formatMonospace(this.id)
    const name = `${id} (${expires})`

    return { created, expires, id, name }
  }

  get ns() {
    return 'batch'
  }

  get uri() {
    return `/vaccines/${this.vaccine_gtin}/${this.id}`
  }
}
