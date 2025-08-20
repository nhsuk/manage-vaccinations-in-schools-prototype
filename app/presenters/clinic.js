import { en } from '../locales/en.js'
import { Clinic } from '../models/clinic.js'
import { getTableCell } from '../utils/presenter.js'
import { formatWithSecondaryText } from '../utils/string.js'

import { AddressPresenter } from './address.js'
import { OrganisationPresenter } from './organisation.js'

/**
 * @class ClinicPresenter
 * @param {Clinic} clinic - Clinic
 * @param {object} [context] - Context
 */
export class ClinicPresenter {
  #clinic
  #context

  constructor(clinic, context) {
    this.#clinic = clinic
    this.#context = context

    this.id = clinic.id
    this.uri = clinic.uri
    this.name = clinic.name
    this.organisation_code = clinic.organisation_code
  }

  /**
   * Present clinic
   *
   * @param {string} id - Clinic ID
   * @param {object} context - Context
   * @returns {ClinicPresenter|undefined} Clinic
   * @static
   */
  static forOne(id, context) {
    const clinic = Clinic.findOne(id, context)

    return new ClinicPresenter(clinic, context)
  }

  /**
   * Get formatted address
   *
   * @returns {string} Formatted address
   */
  get address() {
    return new AddressPresenter(this.#clinic.address).singleline
  }

  /**
   * Get formatted location (name and address)
   *
   * @returns {string} string - Formatted location (name and address)
   */
  get location() {
    return formatWithSecondaryText(
      this.#clinic.name,
      this.#clinic.address &&
        new AddressPresenter(this.#clinic.address).singleline
    )
  }

  /**
   * Get organisation this clinic belongs to
   *
   * @returns {OrganisationPresenter} Organisation
   */
  get organisation() {
    return this.#clinic?.organisation_code
      ? OrganisationPresenter.forOne(
          this.#clinic.organisation_code,
          this.#context
        )
      : null
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
            key: en.clinic[fieldName].label,
            value: this[fieldName] || this.#clinic[fieldName],
            href: fields[fieldName].href
          })
        )
      }
    }

    return cells
  }
}
