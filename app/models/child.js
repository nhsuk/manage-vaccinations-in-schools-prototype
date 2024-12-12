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
 * @property {import('./address.js').Address} [address] - Address
 * @property {string} [gpSurgery] - GP surgery
 * @property {string} [registrationGroup] - Registration group
 * @property {string} [school_urn] - School
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
    this.school_urn = options?.school_urn
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
   * Get school
   *
   * @returns {object|undefined} - School
   */
  get school() {
    if (this.school_urn) {
      return schools[this.school_urn]
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    const yearGroup = formatYearGroup(this.yearGroup)

    return {
      dob: formatDate(this.dob, { dateStyle: 'long' }),
      dod: formatDate(this.dod, { dateStyle: 'long' }),
      yearGroup: formatYearGroup(this.yearGroup),
      yearGroupWithRegistration: this.registrationGroup
        ? `${yearGroup} (${this.registrationGroup})`
        : yearGroup,
      address: this?.address && new Address(this.address).formatted.multiline,
      school: this?.school && this.school.name
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
