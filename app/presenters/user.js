import { en } from '../locales/en.js'
import { User } from '../models/user.js'
import { formatLink, formatMonospace } from '../utils/string.js'

/**
 * @class UserPresenter
 * @param {User} user - User
 */
export class UserPresenter {
  #user

  constructor(user) {
    this.#user = user

    this.uid = user.uid
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
   * @returns {Array<UserPresenter>|undefined} User
   * @static
   */
  static forAll(context) {
    const users = User.findAll(context)

    return Object.values(users).map((user) => new UserPresenter(user))
  }

  /**
   * Get full name, formatted as LASTNAME, Firstname
   *
   * @returns {string} - Full name
   */
  get fullName() {
    return [this.#user.lastName.toUpperCase(), this.#user.firstName].join(', ')
  }

  /**
   * Get user name and role
   *
   * @returns {string} - Full name
   */
  get nameAndRole() {
    return `${this.fullName} (${this.#user.role})`
  }

  /**
   * Get summary rows for display in templates
   *
   * @param {object} fields - Fields to include
   * @returns {Array} - Summary rows
   */
  getSummaryRows(fields = {}) {
    const rows = []

    if (fields.uid) {
      rows.push({
        key: { text: en.user.uid.label },
        value: { html: formatMonospace(this.#user.uid) },
        ...fields.uid
      })
    }

    if (fields.fullName) {
      rows.push({
        key: { text: en.user.fullName.label },
        value: { text: this.fullName },
        ...fields.fullName
      })
    }

    if (fields.email) {
      rows.push({
        key: { text: en.user.email.label },
        value: { text: this.#user.email ?? 'Not provided' },
        ...fields.email
      })
    }

    if (fields.role) {
      rows.push({
        key: { text: en.user.role.label },
        value: { text: this.#user.role ?? 'No role assigned' },
        ...fields.role
      })
    }

    rows.at(-1).classes = 'nhsuk-summary-list__row--no-border'

    return rows
  }

  /**
   * Get table row for display in templates
   *
   * @returns {Array} - Table row cells
   */
  get tableRow() {
    return [
      {
        header: en.user.fullName.label,
        html: formatLink(this.#user.uri, this.fullName ?? 'Not provided')
      },
      {
        header: en.user.uid.label,
        html: formatMonospace(this.#user.uid)
      },
      {
        header: en.user.email.label,
        html: this.#user.email ?? 'Not provided'
      }
    ]
  }
}
