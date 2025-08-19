import { en } from '../locales/en.js'
import { School } from '../models/school.js'
import { getSummaryRow, getTableCell } from '../utils/presenter.js'
import { formatMonospace, formatWithSecondaryText } from '../utils/string.js'

import { AddressPresenter } from './address.js'

/**
 * @class SchoolPresenter
 * @param {School} school - School
 * @param {object} [context] - Context
 */
export class SchoolPresenter {
  #school
  #context

  constructor(school, context) {
    this.#school = school
    this.#context = context

    this.uri = school.uri
    this.name = school.name
    this.phase = school.phase
    this.patientsByYearGroup = school.patientsByYearGroup
  }

  /**
   * Present school
   *
   * @param {string} urn - School URN
   * @param {object} context - Context
   * @returns {SchoolPresenter|undefined} School
   * @static
   */
  static forOne(urn, context) {
    const school = School.findOne(urn, context)

    return new SchoolPresenter(school, context)
  }

  /**
   * Present schools
   *
   * @param {object} context - Context
   * @returns {Array<SchoolPresenter>|undefined} Schools
   * @static
   */
  static forAll(context) {
    const schools = School.findAll(context)

    return Object.values(schools).map(
      (school) => new SchoolPresenter(school, context)
    )
  }

  /**
   * Get formatted URN
   *
   * @returns {string} Formatted URN
   */
  get urn() {
    return formatMonospace(this.#school.urn)
  }

  /**
   * Get formatted address
   *
   * @returns {string} Formatted address
   */
  get address() {
    return new AddressPresenter(this.#school.address).singleline
  }

  /**
   * Get formatted location (name and address)
   *
   * @returns {string} Formatted location (name and address)
   */
  get location() {
    return formatWithSecondaryText(
      this.#school.name,
      this.#school.address &&
        new AddressPresenter(this.#school.address).singleline
    )
  }

  /**
   * Get summary rows for display in templates
   *
   * @param {object} fields - Fields to include
   * @returns {Array} Summary rows
   */
  getSummaryRows(fields = {}) {
    const rows = []

    for (const fieldName of Object.keys(fields)) {
      if (fields[fieldName]) {
        rows.push(
          getSummaryRow({
            key: en.school[fieldName].label,
            value: this[fieldName] || this.#school[fieldName]
          })
        )
      }
    }

    rows.at(-1).classes = 'nhsuk-summary-list__row--no-border'

    return rows
  }

  /**
   * Get table row for display in templates
   *
   * @param {object} fields - Fields to include
   * @returns {Array} Table row cells
   */
  getTableRow(fields = {}) {
    const cells = []

    for (const fieldName of Object.keys(fields)) {
      if (fields[fieldName]) {
        cells.push(
          getTableCell({
            key: en.school[fieldName].label,
            value: this[fieldName] || this.#school[fieldName],
            href: fields[fieldName].href
          })
        )
      }
    }

    return cells
  }
}
