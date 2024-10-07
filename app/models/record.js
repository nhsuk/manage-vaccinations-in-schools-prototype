import { fakerEN_GB as faker } from '@faker-js/faker'
import firstNames from '../datasets/first-names.js'
import gpSurgeries from '../datasets/clinics.js'
import schools from '../datasets/schools.js'
import { Parent } from './parent.js'
import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  getAge,
  getYearGroup
} from '../utils/date.js'
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
 * @property {object} [dob_] - Date of birth (from `dateInput`)
 * @property {Sex} sex - Sex
 * @property {object} address - Address
 * @property {GPRegistered} gpRegistered - Registered with a GP
 * @property {string} [gpSurgery] - GP surgery
 * @property {string} urn - School URN
 * @property {Parent} [parent1] - Parent 1
 * @property {Parent} [parent2] - Parent 2
 * @property {Array<string>} [vaccinations] - Vaccination UUIDs
 * @property {Record} [pendingChanges] - Pending changes to record values
 */
export class Record {
  constructor(options) {
    this.nhsn = options?.nhsn || this.nhsNumber
    this.firstName = options.firstName
    this.lastName = options.lastName
    this.dob = options.dob
    this.dob_ = options?.dob_
    this.sex = options.sex
    this.address = options.address
    this.gpRegistered = options.gpRegistered
    this.gpSurgery = options.gpSurgery
    this.urn = options.urn
    this.parent1 = options?.parent1 && new Parent(options.parent1)
    this.parent2 = options?.parent2 && new Parent(options.parent2)
    this.vaccinations = options?.vaccinations || []
    this.pendingChanges = options?.pendingChanges || {}
  }

  /**
   * Generate fake record
   * @returns {Record} - Record
   * @static
   */
  static generate() {
    const sex = faker.helpers.arrayElement(Object.keys(Sex))
    const firstName = faker.helpers.arrayElement(firstNames[sex.toLowerCase()])
    const lastName = faker.person.lastName().replace(`'`, '’')
    const phase = faker.helpers.arrayElement(['Primary', 'Secondary'])
    const gpRegistered = faker.helpers.arrayElement(Object.values(GPRegistered))

    let gpSurgery
    const gpSurgeryNames = Object.values(gpSurgeries).map(
      (surgery) => surgery.name
    )
    if (gpRegistered === GPRegistered.Yes) {
      gpSurgery = faker.helpers.arrayElement(gpSurgeryNames)
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

    // Add a pending change
    let pendingChanges = {}
    const hasPendingChanges = faker.datatype.boolean(0.02)

    if (hasPendingChanges) {
      const newDob = new Date(dob)
      newDob.setFullYear(newDob.getFullYear() - 2)
      pendingChanges.dob = newDob
    }

    return new Record({
      firstName,
      lastName,
      dob,
      sex,
      address: {
        addressLine1: faker.location.streetAddress(),
        addressLevel2: faker.location.city(),
        postalCode: faker.location.zipCode({ format: 'CV## #??' })
      },
      gpRegistered,
      gpSurgery,
      urn,
      parent1,
      parent2,
      pendingChanges
    })
  }

  /**
   * Get NHS number
   * @returns {string} - NHS Number
   */
  get nhsNumber() {
    const nhsn = '999#######'.replace(/#+/g, (m) =>
      faker.string.numeric(m.length)
    )
    const temporaryNhsn = faker.string.alpha(10)

    // 5% of records don’t have an NHS number
    const hasNhsNumber = faker.helpers.maybe(() => true, { probability: 0.95 })

    return hasNhsNumber ? nhsn : temporaryNhsn
  }

  /**
   * Has missing NHS number
   * @returns {boolean} - Has missing NHS number
   */
  get hasMissingNhsNumber() {
    return !this.nhsn.match(/^\d{10}$/)
  }

  /**
   * Get full name
   * @returns {string} - Full name
   */
  get fullName() {
    return [this.firstName, this.lastName].join(' ')
  }

  /**
   * Get date of birth for `dateInput`
   * @returns {object|undefined} - `dateInput` object
   */
  get dob_() {
    return convertIsoDateToObject(this.dob)
  }

  /**
   * Set date of birth from `dateInput`
   * @param {object} object - dateInput object
   */
  set dob_(object) {
    if (object) {
      this.dob = convertObjectToIsoDate(object)
    }
  }

  /**
   * Get age
   * @returns {number} - Age in years
   */
  get age() {
    return getAge(this.dob)
  }

  /**
   * Get year group
   * @returns {number} - Year group
   */
  get yearGroup() {
    return getYearGroup(this.dob)
  }

  /**
   * Get date of birth with age
   * @returns {string} - Date of birth with age
   */
  get dobWithAge() {
    return `${this.formatted.dob} (aged ${this.age})`
  }

  /**
   * Get date of birth with year group
   * @returns {string} - Date of birth with year group
   */
  get dobWithYearGroup() {
    return `${this.formatted.dob} (${this.formatted.yearGroup})`
  }

  /**
   * Get post code
   * @returns {string} - Post code
   */
  get postalCode() {
    return this.address.postalCode
  }

  /**
   * Get parents
   * @returns {Array<Parent>} - Parents
   */
  get parents() {
    if (this.parent1 && this.parent2) {
      return [this.parent1, this.parent2]
    }

    return [this.parent1]
  }

  /**
   * Has pending changes
   * @returns {boolean} - Has pending changes
   */
  get hasPendingChanges() {
    return Object.keys(this.pendingChanges).length > 0
  }

  /**
   * Get formatted values
   * @returns {object} - Formatted values
   */
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

  /**
   * Get namespace
   * @returns {string} - Namespace
   */
  get ns() {
    return 'record'
  }

  /**
   * Get URI
   * @returns {string} - URI
   */
  get uri() {
    return `/records/${this.nhsn}`
  }
}
