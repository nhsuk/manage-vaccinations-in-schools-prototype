import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatDate } from '../utils/date.js'
import { range } from '../utils/number.js'
import {
  formatLink,
  formatLinkWithSecondaryText,
  formatMonospace
} from '../utils/string.js'

import { Address } from './address.js'
import { Consent } from './consent.js'
import { Patient } from './patient.js'
import { Session } from './session.js'

/**
 * @readonly
 * @enum {string}
 */
export const SchoolPhase = {
  Primary: 'Primary',
  Secondary: 'Secondary'
}

/**
 * @readonly
 * @enum {string}
 */
export const SchoolTerm = {
  Autumn: 'Autumn',
  Spring: 'Spring',
  Summer: 'Summer'
}

export const schoolTerms = {
  [SchoolTerm.Autumn]: { from: '2024-09-03', to: '2024-12-13' },
  [SchoolTerm.Spring]: { from: '2025-01-06', to: '2025-04-11' },
  [SchoolTerm.Summer]: { from: '2025-04-28', to: '2025-07-21' }
}

/**
 * @class School
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} urn - URN
 * @property {string} name - Name
 * @property {SchoolPhase} [phase] - Phase
 * @property {Address} [address] - Address
 * @property {object} terms - Term dates
 */
export class School {
  constructor(options, context) {
    this.context = context
    this.urn = (options.urn && Number(options.urn)) || faker.string.numeric(6)
    this.name = options?.name
    this.phase = options?.phase
    this.address = options?.address && new Address(options.address)
    this.terms = options?.terms || schoolTerms
  }

  /**
   * Get location
   *
   * @returns {object} - Location
   */
  get location() {
    return {
      name: this.name,
      ...this.address
    }
  }

  /**
   * Get consents (unmatched consent responses)
   *
   * @returns {Array<import('./consent.js').Consent>} - Consent
   */
  get consents() {
    return Consent.readAll(this.context).filter(
      ({ child }) => child.school_urn === this.urn
    )
  }

  /**
   * Get patients
   *
   * @returns {Array<Patient>} - Patient sessions
   */
  get patients() {
    return Patient.readAll(this.context).filter(
      ({ school_urn }) => school_urn === this.urn
    )
  }

  /**
   * Get sessions
   *
   * @returns {Array<Session>} - Sessions
   */
  get sessions() {
    return Session.readAll(this.context)
      .filter(({ school_urn }) => school_urn === this.urn)
      .filter(({ patients }) => patients.length > 0)
  }

  get nextSessionDate() {
    return this.sessions[0]?.nextDate ? this.sessions[0].nextDate : false
  }

  /**
   * Get school year groups
   *
   * @returns {Array} - Records by year group
   */
  get yearGroups() {
    if (this.phase === SchoolPhase.Primary) {
      return [...range(0, 6)]
    }

    return [...range(7, 11)]
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      address: this.address?.formatted.multiline,
      location: Object.values(this.location)
        .filter((string) => string)
        .join(', '),
      nameAndAddress: this.address
        ? `<span>${this.name}</br><span class="nhsuk-u-secondary-text-color">${
            this.address.formatted.singleline
          }</span></span>`
        : this.name,
      nextSessionDate:
        this.nextSessionDate &&
        formatDate(this.nextSessionDate, { dateStyle: 'full' }),
      urn: formatMonospace(this.urn)
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      name: formatLink(this.uri, this.name),
      nameAndUrn: formatLinkWithSecondaryText(
        this.uri,
        this.name,
        formatMonospace(this.urn)
      )
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'school'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/schools/${this.urn}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<School>|undefined} Schools
   * @static
   */
  static readAll(context) {
    return Object.values(context.schools).map(
      (school) => new School(school, context)
    )
  }

  /**
   * Read
   *
   * @param {string} urn - URN
   * @param {object} context - Context
   * @returns {School|undefined} School
   * @static
   */
  static read(urn, context) {
    if (context?.schools) {
      return new School(context.schools[urn], context)
    }
  }
}
