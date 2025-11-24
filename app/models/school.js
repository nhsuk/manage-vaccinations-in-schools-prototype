import { fakerEN_GB as faker } from '@faker-js/faker'
import { default as filters } from '@x-govuk/govuk-prototype-filters'

import { SchoolPhase } from '../enums.js'
import { formatDate, getDateValueDifference } from '../utils/date.js'
import { range } from '../utils/number.js'
import { tokenize } from '../utils/object.js'
import { formatLink, formatMonospace } from '../utils/string.js'

import { Address } from './address.js'
import { Patient } from './patient.js'
import { Programme } from './programme.js'
import { Session } from './session.js'

/**
 * @class School
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} urn - URN
 * @property {string} name - Name
 * @property {SchoolPhase} [phase] - Phase
 * @property {Address} [address] - Address
 */
export class School {
  constructor(options, context) {
    this.context = context
    this.urn = (options.urn && String(options.urn)) || faker.string.numeric(6)
    this.name = options?.name
    this.phase = options?.phase
    this.address = options?.address && new Address(options.address)
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
   * Get school pupils
   *
   * @returns {Array<Patient>} Patient records
   */
  get patients() {
    if (this.context?.patients && this.urn) {
      return Object.values(this.context?.patients)
        .filter(({ school_urn }) => school_urn === this.urn)
        .map((patient) => new Patient(patient, this.context))
    }

    return []
  }

  /**
   * Get school pupils missing an NHS number
   *
   * @returns {Array<Patient>} Patient records
   */
  get patientsMissingNhsNumber() {
    return this.patients.filter((patient) => patient.hasMissingNhsNumber)
  }

  /**
   * Get sessions run at this school
   *
   * @returns {Array<Session>} Sessions
   */
  get sessions() {
    return Session.findAll(this.context)
      .filter((session) => session.school_urn === this.urn)
      .sort((a, b) => getDateValueDifference(a.date, b.date))
  }

  /**
   * Get next session at this school
   *
   * @returns {Date|undefined} Next session
   */
  get nextSessionDate() {
    if (this.sessions.length > 0) {
      return this.sessions.at(-1).date
    }
  }

  /** Get year groups
   *
   * @returns {Array} Year groups
   */
  get yearGroups() {
    if (this.phase === SchoolPhase.Primary) {
      return [...range(0, 6)]
    }

    return [...range(7, 11)]
  }

  /**
   * Get programmes that run at this school
   *
   * @returns {Array<Programme>} Programmes
   */
  get programmes() {
    return Programme.findAll(this.context).filter((programme) =>
      programme.yearGroups.some((yearGroup) =>
        this.yearGroups.includes(yearGroup)
      )
    )
  }

  /**
   * Get tokenised values (to use in search queries)
   *
   * @returns {string} Tokens
   */
  get tokenized() {
    const tokens = tokenize(this, ['location.postalCode', 'location.name'])

    return [tokens].join(' ')
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
        : this.name,
      nextSessionDate: formatDate(this.nextSessionDate, {
        dateStyle: 'full'
      }),
      patients: filters.plural(this.patients.length, 'child'),
      urn: formatMonospace(this.urn)
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} Formatted links
   */
  get link() {
    return {
      name: formatLink(this.uri, this.name)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} Namespace
   */
  get ns() {
    return 'school'
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/schools/${this.urn}`
  }

  /**
   * Find all
   *
   * @param {object} context - Context
   * @returns {Array<School>|undefined} Schools
   * @static
   */
  static findAll(context) {
    return Object.values(context.schools).map(
      (school) => new School(school, context)
    )
  }

  /**
   * Find one
   *
   * @param {string} urn - URN
   * @param {object} context - Context
   * @returns {School|undefined} School
   * @static
   */
  static findOne(urn, context) {
    if (context?.schools?.[urn]) {
      return new School(context.schools[urn], context)
    }
  }
}
