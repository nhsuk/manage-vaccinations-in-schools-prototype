import { en } from '../locales/en.js'
import { User } from '../models/user.js'
import { getSummaryRow, getTableCell } from '../utils/presenter.js'
import { formatMonospace } from '../utils/string.js'

/**
 * @class UserPresenter
 * @param {User} user - User
 */
export class UserPresenter {
  #user

  constructor(user) {
    this.#user = user

    this.uri = user.uri
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.email = user.email
    this.role = user.role
    this.canPrescribe = user.canPrescribe
    this.vaccineMethods = user.vaccineMethods
    this.vaccinations = user.vaccinations
  }

  /**
   * Present user
   *
   * @param {string} uid - User UID
   * @param {object} context - Context
   * @returns {UserPresenter|undefined} User
   * @static
   */
  static forOne(uid, context) {
    const user = User.findOne(uid, context)

    return new UserPresenter(user)
  }

  /**
   * Present users
   *
   * @param {object} context - Context
   * @returns {Array<UserPresenter>|undefined} Users
   * @static
   */
  static forAll(context) {
    const users = User.findAll(context)

    return Object.values(users).map((user) => new UserPresenter(user))
  }

  /**
   * Get formatted UID
   *
   * @returns {string} Formatted UID
   */
  get uid() {
    return formatMonospace(this.#user.uid)
  }

  /**
   * Get full name, formatted as LASTNAME, Firstname
   *
   * @returns {string} Full name
   */
  get fullName() {
    return [this.#user.lastName.toUpperCase(), this.#user.firstName].join(', ')
  }

  /**
   * Get full name and role
   *
   * @returns {string} Full name and role
   */
  get nameAndRole() {
    return `${this.fullName} (${this.#user.role})`
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
            key: en.user[fieldName].label,
            value: this[fieldName] || this.#user[fieldName]
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
            key: en.user[fieldName].label,
            value: this[fieldName] || this.#user[fieldName],
            href: fields[fieldName].href
          })
        )
      }
    }

    return cells
  }
}
