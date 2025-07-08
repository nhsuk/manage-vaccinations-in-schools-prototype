import { fakerEN_GB as faker } from '@faker-js/faker'

import { SchoolPhase } from '../enums.js'
import { range } from '../utils/number.js'
import { formatLink, formatMonospace } from '../utils/string.js'

import { Address } from './address.js'
import { Record } from './record.js'

/**
 * @class School
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} urn - URN
 * @property {string} name - Name
 * @property {SchoolPhase} [phase] - Phase
 * @property {Address} [address] - Address
 */
export class School {
  constructor(options, context) {
    this.context = context
    this.urn = (options.urn && String(options.urn)) || faker.string.numeric(6)
    this.name = options?.name
    this.phase = options?.phase
    this.address = options?.address && new Address(options.address)
  }

  /**
   * Get location
   *
   * @returns {object} - Location
   */
  get location() {
    return {
      name: this.name,
      ...this.address
    }
  }

  /**
   * Get school pupils
   *
   * @returns {Array<Record>} - Records
   */
  get records() {
    if (this.context?.records && this.urn) {
      return Object.values(this.context?.records)
        .filter((record) => record.school_urn === this.urn)
        .map((record) => new Record(record))
    }

    return []
  }

  /**
   * Get school pupils
   *
   * @returns {object} - Records by year group
   */
  get recordsByYearGroup() {
    if (this.context?.records && this.records) {
      return Object.groupBy(this.records, ({ yearGroup }) => yearGroup)
    }

    return []
  }

  /** Get year groups
   *
   * @returns {Array} - Year groups
   */
  get yearGroups() {
    if (this.phase === SchoolPhase.Primary) {
      return [...range(0, 6)]
    }

    return [...range(7, 11)]
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      address: this.address?.formatted.multiline,
      location: Object.values(this.location)
        .filter((string) => string)
        .join(', '),
      nameAndAddress: this.address
        ? `<span>${this.name}</br><span class="nhsuk-u-secondary-text-color">${
            this.address.formatted.singleline
          }</span></span>`
        : this.name,
      urn: formatMonospace(this.urn)
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      name: formatLink(this.uri, this.name)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'school'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/schools/${this.urn}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<School>|undefined} Schools
   * @static
   */
  static readAll(context) {
    return Object.values(context.schools).map(
      (school) => new School(school, context)
    )
  }

  /**
   * Read
   *
   * @param {string} urn - URN
   * @param {object} context - Context
   * @returns {School|undefined} School
   * @static
   */
  static read(urn, context) {
    if (context?.schools?.[urn]) {
      return new School(context.schools[urn], context)
    }
  }
}
