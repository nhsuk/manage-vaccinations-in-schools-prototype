import { fakerEN_GB as faker } from '@faker-js/faker'
import firstNames from '../datasets/first-names.js'
import gpSurgeries from '../datasets/gp-surgeries.js'
import schools from '../datasets/schools.js'
import { Parent } from './parent.js'
import { formatDate } from '../utils/date.js'
import { formatNhsNumber } from '../utils/string.js'

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
 * @property {Parent} [parent] - Parent
 * @property {Array<string>} [vaccinations] - Vaccination UUIDs
 * @function age - Age in years
 * @function dobWithAge - Date of birth with age in brackets
 * @function fullName - Get full name
 * @function ns - Namespace
 * @function uri - URL
 */
export class Record {
  constructor(options) {
    this.nhsn = options?.nhsn || this.nhsNumber
    this.firstName = options.firstName
    this.lastName = options.lastName
    this.dob = options.dob
    this.sex = options.sex
    this.address = options.address
    this.gpRegistered = options.gpRegistered
    this.gpSurgery = options.gpSurgery
    this.urn = options.urn
    this.parent = options?.parent && new Parent(options.parent)
    this.vaccinations = options?.vaccinations || []
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

    const parent = Parent.generate(lastName, true)

    // CHIS records provide only a subset of parent data
    delete parent.email
    delete parent.sms
    delete parent.contactPreference
    delete parent.contactPreferenceOther

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
      urn,
      parent
    })
  }

  #nhsn = '999#######'.replace(/#+/g, (m) => faker.string.numeric(m.length))
  #temporaryNhsn = faker.string.alpha(10)

  // 5% of records don’t have an NHS number
  get nhsNumber() {
    const hasNhsNumber = faker.helpers.maybe(() => true, { probability: 0.95 })

    return hasNhsNumber ? this.#nhsn : this.#temporaryNhsn
  }

  get age() {
    return Math.floor((new Date() - new Date(this.dob).getTime()) / 3.15576e10)
  }

  get dobWithAge() {
    return `${this.formatted.dob} (aged ${this.age})`
  }

  get fullName() {
    return [this.firstName, this.lastName].join(' ')
  }

  get postalCode() {
    return this.address.postalCode
  }

  get formatted() {
    return {
      nhsn: formatNhsNumber(this.nhsn),
      dob: formatDate(this.dob, {
        dateStyle: 'long'
      }),
      address: Object.values(this.address).join('<br>'),
      gpSurgery:
        this.gpRegistered === GPRegistered.Yes
          ? this.gpSurgery
          : this.gpRegistered,
      urn: schools[this.urn].name
    }
  }

  get ns() {
    return 'record'
  }

  get uri() {
    return `/records/${this.nhsn}`
  }
}
