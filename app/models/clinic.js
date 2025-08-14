import { fakerEN_GB as faker } from '@faker-js/faker'

import { today } from '../utils/date.js'

import { Address } from './address.js'
import { Organisation } from './organisation.js'

/**
 * @class Clinic
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} id - Organisation code
 * @property {Date} [createdAt] - Created date
 * @property {Date} [updatedAt] - Updated date
 * @property {string} [name] - Name
 * @property {Address} [address] - Address
 * @property {string} [organisation_code] - Organisation code
 */
export class Clinic {
  constructor(options, context) {
    this.context = context
    this.id = options?.id || faker.helpers.replaceSymbols('?#####')
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.updatedAt = options?.updatedAt && new Date(options.updatedAt)
    this.name = options?.name
    this.address = options?.address && new Address(options.address)
    this.organisation_code = options?.organisation_code
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
   * Get organisation
   *
   * @returns {Organisation} Organisation
   */
  get organisation() {
    try {
      const organisation = this.context?.organisations[this.organisation_code]
      if (organisation) {
        return new Organisation(organisation)
      }
    } catch (error) {
      console.error('Clinic.organisation', error.message)
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} Formatted values
   */
  get formatted() {
    return {
      address: this.address?.formatted.multiline,
      location: Object.values(this.location)
        .filter((string) => string)
        .join(', '),
      nameAndAddress: this.address
        ? `<span>${this.name}</br><span class="nhsuk-u-secondary-text-colour">${
            this.address.formatted.singleline
          }</span></span>`
        : this.name
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} Namespace
   */
  get ns() {
    return 'clinic'
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/organisations/${this.organisation_code}/clinics/${this.id}`
  }

  /**
   * Find one
   *
   * @param {string} id - Clinic ID
   * @param {object} context - Context
   * @returns {Clinic|undefined} Clinic
   * @static
   */
  static findOne(id, context) {
    if (context?.clinics?.[id]) {
      return new Clinic(context.clinics[id], context)
    }
  }

  /**
   * Create
   *
   * @param {Clinic} clinic - Clinic
   * @param {object} context - Context
   * @returns {Clinic} Created clinic
   * @static
   */
  static create(clinic, context) {
    const createdClinic = new Clinic(clinic)

    // Add to organisation
    context.organisations[createdClinic.organisation_code].clinic_ids.push(
      createdClinic.id
    )

    // Update context
    context.clinics = context.clinics || {}
    context.clinics[createdClinic.id] = createdClinic

    return createdClinic
  }

  /**
   * Update
   *
   * @param {string} id - Clinic ID
   * @param {object} updates - Updates
   * @param {object} context - Context
   * @returns {Clinic} Updated clinic
   * @static
   */
  static update(id, updates, context) {
    const updatedClinic = Object.assign(Clinic.findOne(id, context), updates)
    updatedClinic.updatedAt = today()

    // Remove clinic context
    delete updatedClinic.context

    // Delete original clinic (with previous ID)
    delete context.clinics[id]

    // Update context
    context.clinics[updatedClinic.id] = updatedClinic

    return updatedClinic
  }

  /**
   * Delete
   *
   * @param {string} id - Clinic ID
   * @param {object} context - Context
   * @static
   */
  static delete(id, context) {
    const clinic = Clinic.findOne(id, context)

    // Remove from organisation
    context.organisations[clinic.organisation_code].clinic_ids =
      context.organisations[clinic.organisation_code].clinic_ids.filter(
        (item) => item !== id
      )

    delete context.clinics[id]
  }
}
