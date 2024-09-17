import { fakerEN_GB as faker } from '@faker-js/faker'
import firstNames from '../datasets/first-names.js'
import gpSurgeries from '../datasets/gp-surgeries.js'
import schools from '../datasets/schools.js'
import { Parent } from './parent.js'
import { formatDate, getAge, getYearGroup } from '../utils/date.js'
import {
  formatList,
  formatNhsNumber,
  formatParent,
  formatYearGroup
} from '../utils/string.js'

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
    this.parent1 = options?.parent1 && new Parent(options.parent1)
    this.parent2 = options?.parent2 && new Parent(options.parent2)
    this.vaccinations = options?.vaccinations || []
    // Import mocking
    this._pending = options?._pending || false
    this._pendingChanges = options?._pendingChanges || {}
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
      dob = faker.date.birthdate({ min: 4, max: 11, mode: 'age' })
      urn = faker.helpers.arrayElement(primarySchools).urn
    } else {
      // Children generally receive adolescent vaccinations when younger
      // Note: This means flu cohorts will skew more towards younger children
      const max = faker.helpers.weightedArrayElement([
        { value: 12, weight: 12 },
        { value: 13, weight: 8 },
        { value: 14, weight: 4 },
        { value: 15, weight: 2 },
        { value: 16, weight: 1 }
      ])
      dob = faker.date.birthdate({ min: 11, max, mode: 'age' })
      urn = faker.helpers.arrayElement(secondarySchools).urn
    }

    const parent1 = Parent.generate(lastName, true)

    let parent2
    const addSecondParent = faker.datatype.boolean(0.5)
    if (addSecondParent) {
      parent2 = Parent.generate(lastName)
    }

    // CHIS records provide only a subset of parent data
    delete parent1.email
    delete parent1.sms
    delete parent1.contactPreference
    delete parent1.contactPreferenceOther

    // Only import 50% of records
    const _pending = faker.datatype.boolean(0.5)

    // Add a pending change
    let _pendingChanges = {}
    if (_pending) {
      const hasPendingChanges = faker.datatype.boolean(0.02)

      if (hasPendingChanges) {
        const newDob = new Date(dob)
        newDob.setFullYear(newDob.getFullYear() - 2)
        _pendingChanges.dob = newDob
      }
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
      urn,
      parent1,
      parent2,
      _pending,
      _pendingChanges
    })
  }

  #nhsn = '999#######'.replace(/#+/g, (m) => faker.string.numeric(m.length))
  #temporaryNhsn = faker.string.alpha(10)

  // 5% of records don’t have an NHS number
  get nhsNumber() {
    const hasNhsNumber = faker.helpers.maybe(() => true, { probability: 0.95 })

    return hasNhsNumber ? this.#nhsn : this.#temporaryNhsn
  }

  get missingNhsNumber() {
    return !this.nhsn.match(/^\d{10}$/)
  }

  get hasPendingChanges() {
    return Object.keys(this._pendingChanges).length > 0
  }

  get fullName() {
    return [this.firstName, this.lastName].join(' ')
  }

  get age() {
    return getAge(this.dob)
  }

  get yearGroup() {
    return getYearGroup(this.dob)
  }

  get dobWithAge() {
    return `${this.formatted.dob} (aged ${this.age})`
  }

  get dobWithYearGroup() {
    return `${this.formatted.dob} (${this.formatted.yearGroup})`
  }

  get postalCode() {
    return this.address.postalCode
  }

  get parents() {
    if (this.parent1 && this.parent2) {
      return [this.parent1, this.parent2]
    }

    return [this.parent1]
  }

  get formatted() {
    const formattedParents = this.parents.map((parent) => formatParent(parent))

    return {
      nhsn: formatNhsNumber(this.nhsn),
      dob: formatDate(this.dob, {
        dateStyle: 'long'
      }),
      yearGroup: formatYearGroup(this.yearGroup),
      address: Object.values(this.address).join('<br>'),
      gpSurgery:
        this.gpRegistered === GPRegistered.Yes
          ? this.gpSurgery
          : this.gpRegistered,
      urn: schools[this.urn].name,
      parent1: formatParent(this.parent1),
      parent2: formatParent(this.parent2),
      parents: formatList(formattedParents)
    }
  }

  get ns() {
    return 'record'
  }

  get uri() {
    return `/records/${this.nhsn}`
  }
}
