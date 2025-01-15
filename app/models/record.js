import { fakerEN_GB as faker } from '@faker-js/faker'

import schools from '../datasets/schools.js'
import {
  formatList,
  formatNhsNumber,
  formatParent,
  stringToBoolean
} from '../utils/string.js'

import { Child } from './child.js'
import { Parent } from './parent.js'
import { Vaccination } from './vaccination.js'

/**
 * @class Child Health Information Service (CHIS) record
 * @augments Child
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} nhsn - NHS number
 * @property {Parent} [parent1] - Parent 1
 * @property {Parent} [parent2] - Parent 2
 * @property {Array<string>} [vaccination_uuids] - Vaccination UUIDs
 * @property {Record} [pendingChanges] - Pending changes to record values
 * @property {boolean} sensitive - Flagged as sensitive
 */
export class Record extends Child {
  constructor(options, context) {
    super(options)

    const sensitive = stringToBoolean(options?.sensitive)

    this.context = context
    this.nhsn = options?.nhsn || this.nhsNumber
    this.address = !sensitive && options?.address ? options.address : undefined
    this.parent1 =
      !sensitive && options?.parent1 ? new Parent(options.parent1) : undefined
    this.parent2 =
      !sensitive && options?.parent2 ? new Parent(options.parent2) : undefined
    this.vaccination_uuids = options?.vaccination_uuids || []
    this.pendingChanges = options?.pendingChanges || {}
    this.sensitive = sensitive
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
   * Get parents
   *
   * @returns {Array<Parent>} - Parents
   */
  get parents() {
    if (this.parent1 && this.parent2) {
      return [this.parent1, this.parent2]
    } else if (this.parent1) {
      return [this.parent1]
    }

    return []
  }

  /**
   * Get vaccinations
   *
   * @returns {Array<Vaccination>} - Vaccinations
   */
  get vaccinations() {
    if (this.context?.vaccinations && this.vaccination_uuids) {
      return this.vaccination_uuids.map(
        (uuid) =>
          new Vaccination(this.context?.vaccinations[uuid], this.context)
      )
    }

    return []
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

    return {
      ...super.formatted,
      nhsn: formatNhsNumber(this.nhsn),
      newUrn:
        this.pendingChanges?.school_urn &&
        schools[this.pendingChanges.school_urn].name,
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

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Record>|undefined} Records
   * @static
   */
  static readAll(context) {
    return Object.values(context.records).map(
      (record) => new Record(record, context)
    )
  }

  /**
   * Read
   *
   * @param {string} nhsn - NHS number
   * @param {object} context - Context
   * @returns {Record|undefined} Record
   * @static
   */
  static read(nhsn, context) {
    if (context?.records) {
      return new Record(context.records[nhsn], context)
    }
  }
}
