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
import { formatYearGroup } from '../utils/string.js'

import { Address } from './address.js'

const primarySchools = Object.values(schools).filter(
  ({ phase }) => phase === 'Primary'
)
const secondarySchools = Object.values(schools).filter(
  ({ phase }) => phase === 'Secondary'
)

export class Gender {
  static Female = 'Female'
  static Male = 'Male'
  static NotKnown = 'Not known'
  static NotSpecified = 'Not specified'
}

/**
 * @class Child
 * @property {string} [firstName] - First name
 * @property {string} [lastName] - Last name
 * @property {string} [preferredFirstName] - Preferred first name
 * @property {string} [preferredLastName] - Preferred last name
 * @property {Date} [dob] - Date of birth
 * @property {object} [dob_] - Date of birth (from `dateInput`)
 * @property {Date} [dod] - Date of death
 * @property {Gender} gender - Gender
 * @property {Address} [address] - Address
 * @property {string} [gpSurgery] - GP surgery
 * @property {string} [registrationGroup] - Registration group
 * @property {string} [urn] - School
 */
export class Child {
  constructor(options) {
    this.firstName = options?.firstName || ''
    this.lastName = options?.lastName || ''
    this.preferredFirstName = options?.preferredFirstName
    this.preferredLastName = options?.preferredLastName
    this.dob = options?.dob && new Date(options.dob)
    this.dob_ = options?.dob_
    this.dod = options?.dod ? new Date(options.dod) : undefined
    this.gender = options?.gender
    this.address = options?.address
    this.gpSurgery = options?.gpSurgery
    this.registrationGroup = options?.registrationGroup
    this.urn = options?.urn
  }

  /**
   * Generate fake child
   *
   * @returns {Child} - Child
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

    let preferredFirstName
    if (firstName.startsWith('Al')) {
      preferredFirstName = 'Ali'
    }
    if (firstName.startsWith('Em')) {
      preferredFirstName = 'Em'
    }
    if (firstName.startsWith('Isa')) {
      preferredFirstName = 'Izzy'
    }

    // Date of birth and school
    const phase = faker.helpers.arrayElement(['Primary', 'Secondary'])
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

    // Add examples of children who are home-schooled or at an unknown school
    if (faker.datatype.boolean(0.01)) {
      urn = faker.helpers.arrayElement([888888, 999999])
    }

    // GP surgery
    let gpSurgery
    if (faker.datatype.boolean(0.8)) {
      const gpSurgeryNames = Object.values(gpSurgeries).map(
        (surgery) => surgery.name
      )
      gpSurgery = faker.helpers.arrayElement(gpSurgeryNames)
    }

    // Registration group
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

    return new Child({
      firstName,
      preferredFirstName,
      lastName,
      dob,
      gender,
      address: Address.generate(),
      gpSurgery,
      registrationGroup,
      urn
    })
  }

  /**
   * Get full name
   *
   * @returns {string} - Full name
   */
  get fullName() {
    if (!this.firstName || !this.lastName) return ''

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
   * Get formatted date of birth and age
   *
   * @returns {string} - Date of birth and age in years
   */
  get dobWithAge() {
    return `${this.formatted.dob} (aged ${this.age})`
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
   * Get date of birth with year group
   *
   * @returns {string} - Date of birth with year group
   */
  get dobWithYearGroup() {
    return `${this.formatted.dob} (${this.formatted.yearGroup})`
  }

  /**
   * Get preferred name
   *
   * @returns {string|undefined} - Preferred name
   */
  get preferredName() {
    const firstName = this.preferredFirstName || this.firstName
    const lastName = this.preferredLastName || this.lastName

    if (!firstName || !lastName) return

    if (this.preferredFirstName || this.preferredLastName) {
      return [firstName, lastName].join(' ')
    }
  }

  /**
   * Get full and preferred names
   *
   * @returns {string} - Full and preferred names
   */
  get fullAndPreferredNames() {
    return this.preferredName
      ? `${this.fullName} (known as ${this.preferredName})`
      : this.fullName
  }

  /**
   * Get post code
   *
   * @returns {string|undefined} - Post code
   */
  get postalCode() {
    if (this.address?.postalCode) {
      return this.address.postalCode
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      dob: formatDate(this.dob, { dateStyle: 'long' }),
      dod: formatDate(this.dod, { dateStyle: 'long' }),
      yearGroup: formatYearGroup(this.yearGroup),
      yearGroupWithRegistration: this.registrationGroup
        ? `${this.yearGroup} (${this.registrationGroup})`
        : this.yearGroup,
      address: this?.address && new Address(this.address).formatted.multiline,
      urn: schools[this.urn]?.name
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'child'
  }
}
