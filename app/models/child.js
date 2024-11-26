import schools from '../datasets/schools.js'
import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  getAge
} from '../utils/date.js'
import { formatNhsNumber } from '../utils/string.js'

import { GPRegistered } from './record.js'

/**
 * @class Child
 * @property {string} nhsn - NHS number
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {string} [preferredFirstName] - Preferred first name
 * @property {string} [preferredLastName] - Preferred last name
 * @property {Date|string} dob - Date of birth
 * @property {object} [dob_] - Date of birth (from `dateInput`)
 * @property {object} address - Address
 * @property {GPRegistered} [gpRegistered] - Registered with a GP
 * @property {string} [gpSurgery] - GP surgery
 * @property {string} [urn] - School
 */
export class Child {
  constructor(options) {
    this.nhsn = options.nhsn
    this.firstName = options.firstName || ''
    this.lastName = options.lastName || ''
    this.preferredFirstName = options?.preferredFirstName
    this.preferredLastName = options?.preferredLastName
    this.dob = new Date(options.dob)
    this.dob_ = options?.dob_
    this.address = options?.address
    this.gpRegistered = options?.gpRegistered
    this.gpSurgery = options?.gpSurgery
    this.urn = options?.urn
  }

  /**
   * Generate fake child
   *
   * @param {import('./record.js').Record} record - Record
   * @returns {Child} - Child
   * @static
   */
  static generate(record) {
    let preferredFirstName
    if (record.firstName.startsWith('Al')) {
      preferredFirstName = 'Ali'
    }
    if (record.firstName.startsWith('Em')) {
      preferredFirstName = 'Em'
    }
    if (record.firstName.startsWith('Isa')) {
      preferredFirstName = 'Izzy'
    }

    return new Child({
      nhsn: record.nhsn,
      firstName: record.firstName,
      preferredFirstName,
      lastName: record.lastName,
      dob: record.dob,
      address: record.address,
      gpRegistered: record.gpRegistered,
      gpSurgery: record.gpSurgery,
      urn: record.urn
    })
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
   * Get full name
   *
   * @returns {string} - Full name
   */
  get fullName() {
    if (!this.firstName || !this.lastName) return ''

    return [this.firstName, this.lastName].join(' ')
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
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    const address =
      this.address && Object.values(this.address).every((value) => value !== '')
        ? Object.values(this.address).join('<br>')
        : ''

    return {
      nhsn: formatNhsNumber(this.nhsn),
      dob: formatDate(this.dob, {
        dateStyle: 'long'
      }),
      address,
      gpSurgery:
        this.gpRegistered === GPRegistered.Yes
          ? this.gpSurgery
          : this.gpRegistered,
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
