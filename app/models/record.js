import { fakerEN_GB as faker } from '@faker-js/faker'

import gpSurgeries from '../datasets/clinics.js'
import firstNames from '../datasets/first-names.js'
import schools from '../datasets/schools.js'
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
  formatYearGroup,
  stringToBoolean
} from '../utils/string.js'

import { Parent } from './parent.js'

const primarySchools = Object.values(schools).filter(
  (school) => school.phase === 'Primary'
)
const secondarySchools = Object.values(schools).filter(
  (school) => school.phase === 'Secondary'
)

export class Gender {
  static Female = 'Female'
  static Male = 'Male'
  static NotKnown = 'Not known'
  static NotSpecified = 'Not specified'
}

/**
 * @class Child Health Information Service (CHIS) record
 * @property {string} nhsn - NHS number
 * @property {string} firstName - First/given name
 * @property {string} lastName - Last/family name
 * @property {Date} dob - Date of birth
 * @property {object} [dob_] - Date of birth (from `dateInput`)
 * @property {Date} dod - Date of death
 * @property {Gender} gender - Gender
 * @property {object} address - Address
 * @property {string} gpSurgery - GP surgery
 * @property {string} urn - School URN
 * @property {string} registrationGroup - Registration group
 * @property {Parent} [parent1] - Parent 1
 * @property {Parent} [parent2] - Parent 2
 * @property {Array<string>} [vaccinations] - Vaccination UUIDs
 * @property {Record} [pendingChanges] - Pending changes to record values
 * @property {boolean} sensitive - Flagged as sensitive
 */
export class Record {
  constructor(options) {
    const sensitive = stringToBoolean(options?.sensitive)

    this.nhsn = options?.nhsn || this.nhsNumber
    this.firstName = options.firstName
    this.lastName = options.lastName
    this.dob = new Date(options.dob)
    this.dob_ = options?.dob_
    this.dod = options?.dod ? new Date(options.dod) : undefined
    this.gender = options.gender
    this.address = !sensitive ? options.address : undefined
    this.gpSurgery = options.gpSurgery || ''
    this.urn = options.urn
    this.registrationGroup = options?.registrationGroup
    this.parent1 =
      !sensitive && options?.parent1 ? new Parent(options.parent1) : undefined
    this.parent2 =
      !sensitive && options?.parent2 ? new Parent(options.parent2) : undefined
    this.vaccinations = options?.vaccinations || []
    this.pendingChanges = options?.pendingChanges || {}
    this.sensitive = sensitive
  }

  /**
   * Generate fake record
   *
   * @returns {Record} - Record
   * @static
   */
  static generate() {
    // Gender
    const gender = faker.helpers.weightedArrayElement([
      { value: Gender.Male, weight: 50 },
      { value: Gender.Female, weight: 50 },
      { value: Gender.NotKnown, weight: 1 },
      { value: Gender.NotSpecified, weight: 1 }
    ])

    // Name
    const firstName = faker.helpers.arrayElement(firstNames[gender])
    const lastName = faker.person.lastName().replace(`'`, '’')
    const phase = faker.helpers.arrayElement(['Primary', 'Secondary'])

    // GP surgery
    let gpSurgery
    if (faker.datatype.boolean(0.8)) {
      const gpSurgeryNames = Object.values(gpSurgeries).map(
        (surgery) => surgery.name
      )
      gpSurgery = faker.helpers.arrayElement(gpSurgeryNames)
    }

    // Date of birth and school
    let dob, urn, newUrn
    if (phase === 'Primary') {
      dob = faker.date.birthdate({ min: 4, max: 11, mode: 'age' })
      urn = faker.helpers.arrayElement(primarySchools).urn
      newUrn = faker.helpers.arrayElement(primarySchools).urn
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
      newUrn = faker.helpers.arrayElement(secondarySchools).urn
    }

    // Add examples of children who are home-schooled or at an unknown school
    if (faker.datatype.boolean(0.05)) {
      urn = faker.helpers.arrayElement([888888, 999999])
    }

    // Get registration group
    let registrationGroup
    const hasRegistrationGroup = String(urn).startsWith('13')
    if (hasRegistrationGroup) {
      const yearGroup = getYearGroup(dob)
      const registration = faker.string.alpha({
        length: 2,
        casing: 'upper',
        exclude: ['A', 'E', 'I', 'O', 'U']
      })

      registrationGroup = `${yearGroup}${registration}`
    }

    // Parents
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

    // Pending changes
    const pendingChanges = {}
    const hasPendingChanges = faker.datatype.boolean(0.1)

    if (hasPendingChanges) {
      const newDob = new Date(dob)
      newDob.setFullYear(newDob.getFullYear() - 2)
      pendingChanges.dob = newDob
      pendingChanges.urn = newUrn
    }

    return new Record({
      firstName,
      lastName,
      dob,
      gender,
      address: {
        addressLine1: faker.location.streetAddress(),
        addressLevel2: faker.location.city(),
        postalCode: faker.location.zipCode({ format: 'CV## #??' })
      },
      gpSurgery,
      urn,
      registrationGroup,
      parent1,
      parent2,
      pendingChanges
    })
  }

  /**
   * Get NHS number
   *
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
   *
   * @returns {boolean} - Has missing NHS number
   */
  get hasMissingNhsNumber() {
    return !this.nhsn.match(/^\d{10}$/)
  }

  /**
   * Get full name
   *
   * @returns {string} - Full name
   */
  get fullName() {
    return [this.firstName, this.lastName].join(' ')
  }

  /**
   * Get obscured name (to use in page titles)
   *
   * @returns {string} - Full name
   */
  get initials() {
    return [this.firstName[0], this.lastName[0]].join('')
  }

  /**
   * Get date of birth for `dateInput`
   *
   * @returns {object|undefined} - `dateInput` object
   */
  get dob_() {
    return convertIsoDateToObject(this.dob)
  }

  /**
   * Set date of birth from `dateInput`
   *
   * @param {object} object - dateInput object
   */
  set dob_(object) {
    if (object) {
      this.dob = convertObjectToIsoDate(object)
    }
  }

  /**
   * Get age
   *
   * @returns {number} - Age in years
   */
  get age() {
    return getAge(this.dob)
  }

  /**
   * Get year group
   *
   * @returns {number} - Year group, for example 8
   */
  get yearGroup() {
    return getYearGroup(this.dob)
  }

  /**
   * Get date of birth with age
   *
   * @returns {string} - Date of birth with age
   */
  get dobWithAge() {
    return `${this.formatted.dob} (aged ${this.age})`
  }

  /**
   * Get date of birth with year group
   *
   * @returns {string} - Date of birth with year group
   */
  get dobWithYearGroup() {
    return `${this.formatted.dob} (${this.formatted.yearGroup})`
  }

  /**
   * Get post code
   *
   * @returns {string|undefined} - Post code
   */
  get postalCode() {
    if (this.address) {
      return this.address.postalCode
    }
  }

  /**
   * Get parents
   *
   * @returns {Array<Parent>|undefined} - Parents
   */
  get parents() {
    if (this.parent1 && this.parent2) {
      return [this.parent1, this.parent2]
    } else if (this.parent1) {
      return [this.parent1]
    }
  }

  /**
   * Has pending changes
   *
   * @returns {boolean} - Has pending changes
   */
  get hasPendingChanges() {
    return Object.keys(this.pendingChanges).length > 0
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    const formattedParents =
      this.parents && this.parents.map((parent) => formatParent(parent))

    const yearGroup = formatYearGroup(this.yearGroup)

    return {
      nhsn: formatNhsNumber(this.nhsn),
      dob: formatDate(this.dob, { dateStyle: 'long' }),
      dod: formatDate(this.dod, { dateStyle: 'long' }),
      yearGroup,
      yearGroupWithRegistration: this.registrationGroup
        ? `${yearGroup} (${this.registrationGroup})`
        : yearGroup,
      address: this.address && Object.values(this.address).join('<br>'),
      urn: schools[this.urn].name,
      newUrn: this.pendingChanges?.urn && schools[this.pendingChanges.urn].name,
      parent1: this.parent1 && formatParent(this.parent1),
      parent2: this.parent2 && formatParent(this.parent2),
      parents: formatList(formattedParents)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'record'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/records/${this.nhsn}`
  }
}
