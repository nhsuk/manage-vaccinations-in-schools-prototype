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

const primarySchools = Object.values(schools).filter(
  (school) => school.phase === 'Primary'
)
const secondarySchools = Object.values(schools).filter(
  (school) => school.phase === 'Secondary'
)

/**
 * @class Child Health Information Service (CHIS) record
 * @augments Child
 * @property {string} nhsn - NHS number
 * @property {Parent} [parent1] - Parent 1
 * @property {Parent} [parent2] - Parent 2
 * @property {Array<string>} [vaccination_uuids] - Vaccination UUIDs
 * @property {Record} [pendingChanges] - Pending changes to record values
 * @property {boolean} sensitive - Flagged as sensitive
 */
export class Record extends Child {
  constructor(options) {
    super(options)

    const sensitive = stringToBoolean(options?.sensitive)

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
   * Generate fake record
   *
   * @returns {Record} - Record
   * @static
   */
  static generate() {
    const child = Child.generate()

    // Parents
    const parent1 = Parent.generate(child.lastName, true)

    let parent2
    const addSecondParent = faker.datatype.boolean(0.5)
    if (addSecondParent) {
      parent2 = Parent.generate(child.lastName)
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
      // Adjust date of birth
      const newDob = new Date(child.dob)
      newDob.setFullYear(newDob.getFullYear() - 2)
      pendingChanges.dob = newDob

      // Move school
      const newUrn =
        schools[child.urn]?.phase === 'Primary'
          ? faker.helpers.arrayElement(primarySchools).urn
          : faker.helpers.arrayElement(secondarySchools).urn
      pendingChanges.urn = newUrn
    }

    return new Record({
      ...child,
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

    return {
      ...super.formatted,
      nhsn: formatNhsNumber(this.nhsn),
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
