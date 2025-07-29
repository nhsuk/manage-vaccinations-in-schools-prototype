import { fakerEN_GB as faker } from '@faker-js/faker'
import prototypeFilters from '@x-govuk/govuk-prototype-filters'

import { UploadStatus, UploadType } from '../enums.js'
import { formatDate, today } from '../utils/date.js'
import { formatWithSecondaryText, formatYearGroup } from '../utils/string.js'

import { Patient } from './patient.js'
import { School } from './school.js'
import { User } from './user.js'

/**
 * @class Upload
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} id - Upload ID
 * @property {UploadStatus} status - Upload status
 * @property {UploadType} type - Upload type
 * @property {Date} [createdAt] - Created date
 * @property {string} [createdBy_uid] - User who created upload
 * @property {Date} [updatedAt] - Updated date
 * @property {Array<string>} [patient_nhsns] - Patient record NHS numbers
 * @property {number} [devoid] - Exact duplicate records found
 */
export class Upload {
  constructor(options, context) {
    this.context = context
    this.id = options?.id || faker.string.hexadecimal({ length: 8, prefix: '' })
    this.status = options?.status || UploadStatus.Processing
    this.type = options?.type || UploadType.Cohort
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdBy_uid = options?.createdBy_uid
    this.updatedAt = options?.updatedAt && new Date(options.updatedAt)
    this.validations = options?.validations || []
    this.patient_nhsns = options?.patient_nhsns || []

    if (this.type === UploadType.School) {
      this.yearGroups = options?.yearGroups
      this.school_urn = options?.school_urn
    }

    if (this.status === UploadStatus.Complete) {
      this.devoid = options?.devoid || faker.number.int({ min: 1, max: 99 })
    }
  }

  /**
   * Get user who created upload
   *
   * @returns {User} User
   */
  get createdBy() {
    try {
      if (this.createdBy_uid) {
        return User.read(this.createdBy_uid, this.context)
      }
    } catch (error) {
      console.error('Upload.createdBy', error.message)
    }
  }

  /**
   * Get uploaded patient records
   *
   * @returns {Array<Patient>} Records
   */
  get patients() {
    if (this.context?.patients && this.patient_nhsns) {
      let patients = this.patient_nhsns.map((nhsn) =>
        Patient.read(nhsn, this.context)
      )

      if (this.type === UploadType.Report) {
        patients = patients
          .filter((patient) => patient.vaccinations.length > 0)
          .map((patient) => {
            patient.vaccination = patient.vaccinations[0]
            return patient
          })
      }

      return patients
    }

    return []
  }

  /**
   * Get number of invalid patient records (no vaccination recorded)
   *
   * @returns {Array<Patient>} Invalid patient records
   */
  get invalid() {
    if (
      this.status === UploadStatus.Complete &&
      this.type === UploadType.Report
    ) {
      if (this.context?.patients && this.patient_nhsns) {
        return this.patient_nhsns
          .map((nhsn) => Patient.read(nhsn, this.context))
          .filter((patient) => patient.vaccinations.length === 0)
      }

      return []
    }
  }

  /**
   * Get duplicate patient records in upload that need review
   *
   * @returns {Array<Patient>|undefined} Patient records with pending changes
   */
  get duplicates() {
    if (this.status === UploadStatus.Complete) {
      if (this.patients) {
        return this.patients
          .filter((patient) => patient.hasPendingChanges)
          .sort((a, b) => a.firstName.localeCompare(b.firstName))
      }

      return []
    }
  }

  /**
   * Get number of incomplete patient records
   *
   * @returns {Array<Patient>|undefined} Patient records missing an NHS number
   */
  get incomplete() {
    if (
      this.status === UploadStatus.Complete &&
      this.type === UploadType.Report
    ) {
      if (this.patients) {
        return this.patients.filter((patient) => patient.hasMissingNhsNumber)
      }

      return []
    }
  }

  /**
   * Get school
   *
   * @returns {object|undefined} School
   */
  get school() {
    if (this.type === UploadType.School && this.school_urn) {
      return School.read(this.school_urn, this.context)
    }
  }

  /**
   * Get school name
   *
   * @returns {string|undefined} School name
   */
  get schoolName() {
    if (this.school) {
      return this.school.name
    }
  }

  /**
   * Get formatted summary
   *
   * @returns {object} Formatted summaries
   */
  get summary() {
    return {
      type:
        this.type === UploadType.School
          ? formatWithSecondaryText(this.type, this.schoolName)
          : this.type
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} Formatted values
   */
  get formatted() {
    const yearGroups =
      this.yearGroups &&
      this.yearGroups
        .filter((yearGroup) => yearGroup !== '_unchecked')
        .map((yearGroup) => formatYearGroup(yearGroup))

    return {
      createdAt: formatDate(this.createdAt, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      createdBy: this.createdBy?.fullName || '',
      ...(this.type === UploadType.School && {
        school: this.schoolName,
        yearGroups: prototypeFilters.formatList(yearGroups)
      }),
      ...(this.status === UploadStatus.Complete && {
        devoid: `${prototypeFilters.plural(this.devoid, 'previously imported record')} omitted`,
        duplicates: `${prototypeFilters.plural(this.duplicates.length, 'duplicate record')} need review`
      }),
      ...(this.status === UploadStatus.Complete &&
        this.type === UploadType.Report && {
          invalid: `${prototypeFilters.plural(this.invalid.length, 'record')} for a child who was not vaccinated omitted`
        })
    }
  }

  /**
   * Get status properties
   *
   * @returns {object} Status properties
   */
  get uploadStatus() {
    let colour
    switch (this.status) {
      case UploadStatus.Complete:
        colour = 'green'
        break
      case UploadStatus.Invalid:
        colour = 'red'
        break
      default:
        colour = 'blue'
    }

    return {
      colour,
      text: this.status
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} Namespace
   */
  get ns() {
    return 'upload'
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/uploads/${this.id}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Upload>|undefined} Uploads
   * @static
   */
  static readAll(context) {
    return Object.values(context.uploads).map(
      (upload) => new Upload(upload, context)
    )
  }

  /**
   * Read
   *
   * @param {string} id - Upload ID
   * @param {object} context - Context
   * @returns {Upload|undefined} Upload
   * @static
   */
  static read(id, context) {
    if (context.uploads?.[id]) {
      return new Upload(context.uploads[id], context)
    }
  }

  /**
   * Create
   *
   * @param {Upload} upload - Upload
   * @param {object} context - Context
   */
  create(upload, context) {
    upload = new Upload(upload)

    // Update context
    context.uploads = context.uploads || {}
    context.uploads[upload.id] = upload
  }

  /**
   * Update
   *
   * @param {object} updates - Updates
   * @param {object} context - Context
   */
  update(updates, context) {
    this.updatedAt = new Date()

    // Remove upload context
    delete this.context

    // Delete original upload (with previous ID)
    delete context.uploads[this.id]

    // Update context
    const updatedUpload = Object.assign(this, updates)
    context.uploads[updatedUpload.id] = updatedUpload
  }
}
