import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatLink, formatMonospace } from '../utils/string.js'

/**
 * @readonly
 * @enum {string}
 */
export const UserRole = {
  Nurse: 'Nurse',
  NursePrescriber: 'Prescribing nurse',
  Pharmacist: 'Pharmacist',
  HCA: 'Healthcare assistant',
  MedicalSecretary: 'Medical secretary',
  DataConsumer: 'Data consumer'
}

/**
 * @class User
 * @property {string} uid - User ID
 * @property {string} [firstName] - First/given name
 * @property {string} [lastName] - Last/family name
 * @property {string} [email] - Email address
 * @property {UserRole} [role] - User role
 * @property {object} [batch] - Default batches
 */
export class User {
  constructor(options) {
    this.uid = options?.uid || faker.string.numeric(12)
    this.firstName = options?.firstName
    this.lastName = options?.lastName
    this.email = options?.email
    this.role = options?.role
    this.batch = options?.batch || {}
  }

  /**
   * Get full name, formatted as LASTNAME, Firstname
   *
   * @returns {string} - Full name
   */
  get fullName() {
    return [this.lastName.toUpperCase(), this.firstName].join(', ')
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      uid: formatMonospace(this.uid)
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      email: formatLink(`mailto:${this.email}`, this.fullName),
      fullName: formatLink(this.uri, this.fullName)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'user'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
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
}
