import { fakerEN_GB as faker } from '@faker-js/faker'
import firstNames from '../datasets/first-names.js'
import gpSurgeries from '../datasets/gp-surgeries.js'
import schools from '../datasets/schools.js'

const primarySchools = Object.values(schools).filter(
  (school) => school.phase === 'Primary'
)
const secondarySchools = Object.values(schools).filter(
  (school) => school.phase === 'Secondary'
)

export class Sex {
  static Female = 'Female'
  static Male = 'Male'
}

export class GPRegistered {
  static Yes = 'Registered'
  static No = 'Not registered'
  static Unknown = 'Not known'
}

/**
 * @class Child Health Information Service (CHIS) record
 * @property {string} nhsn - NHS number
 * @property {string} firstName - First/given name
 * @property {string} lastName - Last/family name
 * @property {string} dob - Date of birth
 * @property {Sex} sex - Sex
 * @property {object} address - Address
 * @property {GPRegistered} gpRegistered - Registered with a GP
 * @property {string} [gpSurgery] - GP surgery
 * @property {string} urn - School URN
 * @function age - Age in years
 * @function dobWithAge - Date of birth with age in brackets
 * @function fullName - Get full name
 * @function formattedDob - Formatted date of birth
 * @function formattedAddress - Get full address, with line breaks
 * @function formattedNhsNumber - Get formatted NHS number
 * @function ns - Namespace
 * @function uri - URL
 */
export class Record {
  constructor(options) {
    this.nhsn = options?.nhsn || this.#nhsn
    this.firstName = options.firstName
    this.lastName = options.lastName
    this.dob = options.dob
    this.sex = options.sex
    this.address = options.address
    this.gpRegistered = options.gpRegistered
    this.gpSurgery = options.gpSurgery
    this.urn = options.urn
  }

  static generate() {
    const sex = faker.helpers.arrayElement(Object.keys(Sex))
    const firstName = faker.helpers.arrayElement(firstNames[sex.toLowerCase()])
    const lastName = faker.person.lastName().replace(`'`, '’')
    const phase = faker.helpers.arrayElement(['Primary', 'Secondary'])
    const gpRegistered = faker.helpers.arrayElement(Object.values(GPRegistered))

    let gpSurgery
    if (gpRegistered === GPRegistered.Yes) {
      gpSurgery = faker.helpers.arrayElement(gpSurgeries)
    }

    let dob, urn
    if (phase === 'Primary') {
      dob = faker.date.birthdate({ min: 2013, max: 2019 })
      urn = faker.helpers.arrayElement(primarySchools).urn
    } else {
      dob = faker.date.birthdate({ min: 2009, max: 2012 })
      urn = faker.helpers.arrayElement(secondarySchools).urn
    }

    return new Record({
      firstName,
      lastName,
      dob,
      sex,
      address: {
        addressLine1: faker.location.streetAddress(),
        addressLevel1: faker.location.city(),
        postalCode: faker.location.zipCode()
      },
      gpRegistered,
      gpSurgery,
      urn
    })
  }

  #nhsn = '999#######'.replace(/#+/g, (m) => faker.string.numeric(m.length))

  get age() {
    return Math.floor((new Date() - new Date(this.dob).getTime()) / 3.15576e10)
  }

  get formattedDob() {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'long'
    }).format(new Date(this.dob))
  }

  get dobWithAge() {
    return `${this.formattedDob} (aged ${this.age})`
  }

  get fullName() {
    return [this.firstName, this.lastName].join(' ')
  }

  get formattedNhsNumber() {
    const numberArray = this.nhsn.split('')
    numberArray.splice(3, 0, ' ')
    numberArray.splice(8, 0, ' ')
    return numberArray.join('')
  }

  get formattedAddress() {
    return Object.values(this.address).join('\n')
  }

  get postalCode() {
    return this.address.postalCode
  }

  get formattedGpSurgery() {
    if (this.gpRegistered === GPRegistered.Yes) {
      return this.gpSurgery
    }

    return this.gpRegistered
  }

  get ns() {
    return 'record'
  }

  get uri() {
    return `/records/${this.nhsn}`
  }
}
