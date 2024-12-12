import { formatLink, formatYearGroup } from '../utils/string.js'

import { Patient } from './patient.js'
import { Programme, ProgrammeType } from './programme.js'

export class AcademicYear {
  static Y2024 = '2024/25'
}

/**
 * @class Cohort
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} uid - UID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created cohort
 * @property {AcademicYear} year - Academic year
 * @property {number} yearGroup - Year group
 * @property {Array<string>} record_nhsns - CHIS record NHS numbers
 * @property {string} [programme_pid] - Programme ID
 * @function ns - Namespace
 * @function uri - URL
 */
export class Cohort {
  constructor(options, context) {
    const year = options?.year || AcademicYear.Y2024

    this.context = context
    this.created = options?.created || `${year.split('/')[0]}-08-01`
    this.created_user_uid = options?.created_user_uid
    this.year = year
    this.yearGroup = options?.yearGroup
    this.record_nhsns = options?.record_nhsns || []
    this.programme_pid = options?.programme_pid
  }

  /**
   * Get UID
   *
   * @returns {string} - UID
   */
  get uid() {
    const yearGroup = String(this.yearGroup).padStart(2, '0')

    return `${this.programme_pid}-${yearGroup}`
  }

  /**
   * Get programme
   *
   * @returns {Programme} - Programme
   */
  get programme() {
    try {
      const programme = this.context?.programmes[this.programme_pid]
      if (programme) {
        return new Programme(programme)
      }
    } catch (error) {
      console.error('Cohort.programme', error.message)
    }
  }

  /**
   * Get patients from cohort records
   *
   * @returns {Array<Patient>} - Records
   */
  get patients() {
    if (this.context?.records && this.record_nhsns) {
      return this.record_nhsns.map(
        (nhsn) => new Patient(this.context?.records[nhsn])
      )
    }

    return []
  }

  /**
   * Get name
   *
   * @returns {string} - Name
   */
  get name() {
    const type = ProgrammeType[this.programme.type]

    return `${type} ${this.formatted.yearGroup} (${this.year})`
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      yearGroup: formatYearGroup(this.yearGroup)
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      name: formatLink(this.uri, this.name)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'cohort'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/programmes/${this.programme_pid}/cohorts/${this.uid}`
  }
}
