import { createMap } from '../utils/object.js'
import { formatLink, formatYearGroup } from '../utils/string.js'

import { Patient } from './patient.js'
import { Programme, ProgrammeType } from './programme.js'

export class AcademicYear {
  static Y2024 = '2024/25'
}

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
 * @property {Array<string>} record_nhsns - CHIS record NHS numbers
 * @property {string} [programme_pid] - Programme ID
 * @function ns - Namespace
 * @function uri - URL
 */
export class Cohort {
  constructor(options, context) {
    const year = options?.year || AcademicYear.Y2024

    this.context = context
    this.createdAt = options?.createdAt || `${year.split('/')[0]}-07-01`
    this.createdBy_uid = options?.createdBy_uid
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
    if (context?.cohorts) {
      return new Cohort(context.cohorts[uid], context)
    }
  }

  /**
   * Select records for cohort
   *
   * @param {object} context - Context
   */
  select(context) {
    const selectedRecords = new Set()
    const records = createMap(context.records)
    records.forEach((record) => {
      if (record.yearGroup === this.yearGroup) {
        selectedRecords.add(record.nhsn)
      }
    })

    // Add selected records to cohort
    this.record_nhsns = [...selectedRecords]

    // Create or update patient record
    const patients = createMap(context.patients)
    for (const nhsn of this.record_nhsns) {
      let patient = [...patients.values()].find(
        (patient) => patient.nhsn === nhsn
      )

      if (!patient) {
        const record = records.get(nhsn)
        patient = new Patient(structuredClone(record))
        patients.set(patient.uuid, patient)
      }

      patient.selectForCohort(this)
    }
  }
}
