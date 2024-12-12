import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatLink, formatMonospace } from '../utils/string.js'

export class UserRole {
  static ClinicalAdmin = 'Nurse'
  static DataAdmin = 'Data administrator'
  static DataConsumer = 'Data consumer'
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
   * Get full name
   *
   * @returns {string} - Full name
   */
  get fullName() {
    return [this.firstName, this.lastName].join(' ')
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
}
