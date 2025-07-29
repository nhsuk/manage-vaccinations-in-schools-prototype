import { getCohortEligibility } from '../utils/cohort.js'
import {
  formatLink,
  formatYearGroup,
  sentenceCaseProgrammeName
} from '../utils/string.js'

// eslint-disable-next-line no-unused-vars
import { PatientSession } from './patient-session.js'
import { Programme } from './programme.js'

/**
 * @class Cohort
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} uid - UID
 * @property {string} createdAt - Created date
 * @property {string} [createdBy_uid] - User who created cohort
 * @property {AcademicYear} year - Academic year
 * @property {number} yearGroup - Year group
 * @property {string} [programme_id] - Programme ID
 * @function ns - Namespace
 * @function uri - URL
 */
export class Cohort {
  constructor(options, context) {
    const year = options?.year

    this.context = context
    this.createdAt = options?.createdAt || `${year.split(' ')[0]}-07-01`
    this.createdBy_uid = options?.createdBy_uid
    this.year = year
    this.yearGroup = options?.yearGroup
    this.programme_id = options?.programme_id
  }

  /**
   * Get UID
   *
   * @returns {string} UID
   */
  get uid() {
    const yearGroup = String(this.yearGroup).padStart(2, '0')

    return `${this.programme_id}-${yearGroup}`
  }

  /**
   * Get programme
   *
   * @returns {Programme} Programme
   */
  get programme() {
    try {
      const programme = this.context?.programmes[this.programme_id]
      if (programme) {
        return new Programme(programme)
      }
    } catch (error) {
      console.error('Cohort.programme', error.message)
    }
  }

  /**
   * Get name
   *
   * @returns {object} Name
   */
  get name() {
    return `${this.formatted.yearGroup} (${this.year}) ${sentenceCaseProgrammeName(this.programme.name)} cohort`
  }

  /**
   * Get formatted values
   *
   * @returns {object} Formatted values
   */
  get formatted() {
    return {
      yearGroup: formatYearGroup(this.yearGroup)
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
    return 'cohort'
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/programmes/${this.programme_id}/patients?yearGroup=${this.yearGroup}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Cohort>|undefined} Cohorts
   * @static
   */
  static readAll(context) {
    return Object.values(context.cohorts).map(
      (cohort) => new Cohort(cohort, context)
    )
  }

  /**
   * Read
   *
   * @param {string} uid - Cohort UID
   * @param {object} context - Context
   * @returns {Cohort|undefined} Cohort
   * @static
   */
  static read(uid, context) {
    if (context?.cohorts?.[uid]) {
      return new Cohort(context.cohorts[uid], context)
    }
  }

  /**
   * Select patient records for cohort
   *
   * @param {object} context - Context
   */
  select(context) {
    for (const patient of Object.values(context.patients)) {
      const eligibleForCohort = getCohortEligibility(this, patient)
      if (eligibleForCohort) {
        patient.selectForCohort(this)
      }
    }
  }
}
