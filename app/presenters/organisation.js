import prototypeFilters from '@x-govuk/govuk-prototype-filters'

import { en } from '../locales/en.js'
import { Organisation } from '../models/organisation.js'
import { ClinicPresenter } from '../presenters/clinic.js'
import { SchoolPresenter } from '../presenters/school.js'
import { getSummaryRow } from '../utils/presenter.js'

/**
 * @class OrganisationPresenter
 * @param {Organisation} user - Organisation
 */
export class OrganisationPresenter {
  #organisation
  #context

  constructor(organisation, context) {
    this.#organisation = organisation
    this.#context = context

    this.code = organisation.code
    this.uri = organisation.uri
    this.name = organisation.name
  }

  /**
   * Present organisation
   *
   * @param {string} code - Organisation ODS code
   * @param {object} context - Context
   * @returns {OrganisationPresenter|undefined} Organisation
   * @static
   */
  static forOne(code, context) {
    const organisation = Organisation.findOne(code, context)

    return new OrganisationPresenter(organisation, context)
  }

  /**
   * Present organisations
   *
   * @param {object} context - Context
   * @returns {Array<OrganisationPresenter>|undefined} Organisations
   * @static
   */
  static forAll(context) {
    const organisations = Organisation.findAll(context)

    return Object.values(organisations).map(
      (organisation) => new OrganisationPresenter(organisation, context)
    )
  }

  /**
   * Get clinics
   *
   * @returns {Array<ClinicPresenter>} Clinics
   */
  get clinics() {
    return this.#organisation.clinic_ids
      .map((id) => ClinicPresenter.forOne(id, this.#context))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Get schools
   *
   * @returns {Array<SchoolPresenter>} Schools
   */
  get schools() {
    return this.#organisation.school_urns
      .map((urn) => SchoolPresenter.forOne(urn, this.#context))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Get number of weeks before session consent window opens
   *
   * @returns {string} Weeks
   */
  get sessionOpenWeeks() {
    const sessionOpenWeeks = prototypeFilters.plural(
      this.#organisation.sessionOpenWeeks,
      'week'
    )

    return `Send ${sessionOpenWeeks} before first session`
  }

  /**
   * Get number of weeks before session reminders are sent
   *
   * @returns {string} Weeks
   */
  get sessionReminderWeeks() {
    const sessionReminderWeeks = prototypeFilters.plural(
      this.#organisation.sessionReminderWeeks,
      'week'
    )

    return `Send ${sessionReminderWeeks} before each session`
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
            key: en.organisation[fieldName].label,
            value: this[fieldName] || this.#organisation[fieldName],
            actions: [{ href: fields[fieldName].href }]
          })
        )
      }
    }

    rows.at(-1).classes = 'nhsuk-summary-list__row--no-border'

    return rows
  }
}
