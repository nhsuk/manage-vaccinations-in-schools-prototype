import { fakerEN_GB as faker } from '@faker-js/faker'

import { ProgrammeType } from '../enums.js'
import { UserPresenter } from '../presenters/user.js'

/**
 * @class User
 * @property {string} uid - User ID
 * @property {string} [firstName] - First/given name
 * @property {string} [lastName] - Last/family name
 * @property {string} [email] - Email address
 * @property {import('../enums.js').UserRole} [role] - User role
 * @property {boolean} [canPrescribe] - Can provide PSD instruction
 * @property {Array<import('../enums.js').VaccineMethod>} - Vaccine methods
 * @property {object} [vaccinations] - Vaccination count
 */
export class User {
  constructor(options) {
    this.uid = options?.uid || faker.string.numeric(12)
    this.firstName = options?.firstName
    this.lastName = options?.lastName
    this.email = options?.email
    this.role = options?.role
    this.canPrescribe = options?.canPrescribe || false
    this.vaccineMethods = options?.vaccineMethods || []
    this.vaccinations = {
      [ProgrammeType.Flu]: options?.vaccinations?.[ProgrammeType.Flu] || 0,
      [ProgrammeType.HPV]: options?.vaccinations?.[ProgrammeType.HPV] || 0,
      [ProgrammeType.MenACWY]:
        options?.vaccinations?.[ProgrammeType.MenACWY] || 0,
      [ProgrammeType.TdIPV]: options?.vaccinations?.[ProgrammeType.TdIPV] || 0
    }
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/users/${this.uid}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<User>|undefined} Users
   * @static
   */
  static readAll(context) {
    return Object.values(context.users).map((user) => new User(user))
  }

  /**
   * Read
   *
   * @param {string} uid - User UID
   * @param {object} context - Context
   * @returns {User|undefined} User
   * @static
   */
  static read(uid, context) {
    if (context?.users?.[uid]) {
      return new User(context.users[uid])
    }
  }

  /**
   * Show all
   *
   * @param {object} context - Context
   * @returns {Array<UserPresenter>|undefined} User
   * @static
   */
  static showAll(context) {
    return Object.values(context.users).map((user) => {
      user = new User(user)

      return new UserPresenter(user)
    })
  }

  /**
   * Show
   *
   * @param {string} uid - User UID
   * @param {object} context - Context
   * @returns {UserPresenter|undefined} User
   * @static
   */
  static show(uid, context) {
    const user = User.read(uid, context)

    return new UserPresenter(user)
  }
}
