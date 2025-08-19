import { fakerEN_GB as faker } from '@faker-js/faker'

import { SchoolPhase } from '../enums.js'
import { range } from '../utils/number.js'

import { Patient } from './patient.js'

/**
 * @class School
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} urn - URN
 * @property {string} name - Name
 * @property {SchoolPhase} [phase] - Phase
 * @property {object} [address] - Address
 */
export class School {
  constructor(options, context) {
    this.context = context
    this.urn = (options.urn && String(options.urn)) || faker.string.numeric(6)
    this.name = options?.name
    this.phase = options?.phase
    this.address = options?.address
  }

  /**
   * Get location
   *
   * @returns {object} Location
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
   * @returns {Array<Patient>} Patient records
   */
  get patients() {
    if (this.context?.patients && this.urn) {
      return Object.values(this.context?.patients)
        .filter(({ school_urn }) => school_urn === this.urn)
        .map((patient) => new Patient(patient))
    }

    return []
  }

  /**
   * Get school pupils
   *
   * @returns {object} Patients by year group
   */
  get patientsByYearGroup() {
    if (this.context?.patients && this.patients) {
      return Object.groupBy(this.patients, ({ yearGroup }) => yearGroup)
    }

    return []
  }

  /** Get year groups
   *
   * @returns {Array} Year groups
   */
  get yearGroups() {
    if (this.phase === SchoolPhase.Primary) {
      return [...range(0, 6)]
    }

    return [...range(7, 11)]
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/schools/${this.urn}`
  }

  /**
   * Find all
   *
   * @param {object} context - Context
   * @returns {Array<School>|undefined} Schools
   * @static
   */
  static findAll(context) {
    return Object.values(context.schools).map(
      (school) => new School(school, context)
    )
  }

  /**
   * Find one
   *
   * @param {string} urn - URN
   * @param {object} context - Context
   * @returns {School|undefined} School
   * @static
   */
  static findOne(urn, context) {
    if (context?.schools?.[urn]) {
      return new School(context.schools[urn], context)
    }
  }
}
