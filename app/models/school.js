import { fakerEN_GB as faker } from '@faker-js/faker'
import { default as filters } from '@x-govuk/govuk-prototype-filters'

import { Location, Patient, Programme, Session } from '../models.js'
import { formatDate, getDateValueDifference } from '../utils/date.js'
import { tokenize } from '../utils/object.js'
import {
  formatLink,
  formatMonospace,
  formatYearGroups,
  stringToBoolean
} from '../utils/string.js'

/**
 * @class School
 * @augments Location
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {boolean} send - SEND school
 * @property {string} urn - URN
 * @property {import('../enums.js').SchoolPhase} [phase] - Phase
 * @property {Array<number>} [yearGroups] - Year groups
 */
export class School extends Location {
  constructor(options, context) {
    super(options, context)

    this.send = stringToBoolean(options?.send) || false
    this.urn = (options.urn && String(options.urn)) || faker.string.numeric(6)
    this.phase = options?.phase
    this.yearGroups = options?.yearGroups || []
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
    if (this.context) {
      return Session.findAll(this.context)
        .filter((session) => session.school_urn === this.urn)
        .sort((a, b) => getDateValueDifference(a.date, b.date))
    }
  }

  /**
   * Get next session at this school
   *
   * @returns {Date|undefined} Next session
   */
  get nextSessionDate() {
    if (this.sessions?.length > 0) {
      return this.sessions.at(-1).date
    }
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
      ...super.formatted,
      nextSessionDate: formatDate(this.nextSessionDate, { dateStyle: 'full' }),
      patients: filters.plural(this.patients.length, 'child'),
      yearGroups: formatYearGroups(this.yearGroups),
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

  /**
   * Create
   *
   * @param {School} school - School
   * @param {object} context - Context
   * @returns {School} Created school
   * @static
   */
  static create(school, context) {
    const createdSchool = new School(school)

    // Add to team
    if (context.teams) {
      context.teams[createdSchool.team_id].school_urns.push(createdSchool.urn)
    }

    // Update context
    context.schools = context.schools || {}
    context.schools[createdSchool.urn] = createdSchool

    return createdSchool
  }

  /**
   * Update
   *
   * @param {string} urn - School URN
   * @param {object} updates - Updates
   * @param {object} context - Context
   * @returns {School} Updated school
   * @static
   */
  static update(urn, updates, context) {
    const updatedSchool = Object.assign(School.findOne(urn, context), updates)

    // Remove school context
    delete updatedSchool.context

    // Delete original school (with previous URN)
    delete context.schools[urn]

    // Update context
    context.schools[updatedSchool.urn] = updatedSchool

    return updatedSchool
  }

  /**
   * Delete
   *
   * @param {string} urn - School URN
   * @param {object} context - Context
   * @static
   */
  static delete(urn, context) {
    const school = School.findOne(urn, context)

    // Remove from team
    context.teams[school.team_id].school_urns = context.teams[
      school.team_id
    ].school_urns.filter((item) => item !== urn)

    delete context.schools[urn]
  }
}
