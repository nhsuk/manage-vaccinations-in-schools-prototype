import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatDate, today } from '../utils/date.js'

import { Programme } from './programme.js'
import { Record } from './record.js'
import { User } from './user.js'
import { Vaccination } from './vaccination.js'

/**
 * @readonly
 * @enum {string}
 */
export const UploadType = Object.freeze({
  Cohort: 'Child records',
  School: 'Class list records',
  Report: 'Vaccination records'
})

/**
 * @readonly
 * @enum {string}
 */
export const UploadStatus = Object.freeze({
  Processing: 'Processing',
  Complete: 'Completed',
  Invalid: 'Invalid'
})

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
 * @property {string} [programme_pid] - Programme ID
 * @property {Array<string>} [record_nhsns] - Record NHS numbers
 * @property {number} [devoid] - Exact duplicate records found
 * @property {number} [duplicate] - Inexact duplicate records found
 * @property {number} [incomplete] - Incomplete records (no NHS number)
 * @property {number|undefined} [invalid] - Invalid records (no vaccination)
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
    this.programme_pid = options?.programme_pid
    this.validations = options?.validations || []
    this.record_nhsns = options?.record_nhsns || []
    this.devoid = options?.devoid || 0
    this.duplicate = options?.duplicate || 0
    this.incomplete = options?.incomplete || 0
    this.invalid =
      this.type === UploadType.Report ? options?.invalid || 0 : undefined
  }

  /**
   * Get user who created upload
   *
   * @returns {User} - User
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
   * Get programme
   *
   * @returns {Programme} - User
   */
  get programme() {
    try {
      if (this.programme_pid) {
        return Programme.read(this.programme_pid, this.context)
      }
    } catch (error) {
      console.error('Upload.programme', error.message)
    }
  }

  /**
   * Get uploaded records
   *
   * @returns {Array<Record>} - Records
   */
  get records() {
    if (this.context?.records && this.record_nhsns) {
      return this.record_nhsns
        .map((nhsn) => Record.read(nhsn, this.context))
        .map((record) => {
          record.vaccination = record.vaccination_uuids.map((uuid) =>
            Vaccination.read(uuid, this.context)
          )[0]
          return record
        })
    }

    return []
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
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
      programme: this.programme.type
    }
  }

  /**
   * Get status properties
   *
   * @returns {object} - Status properties
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
   * @returns {string} - Namespace
   */
  get ns() {
    return 'upload'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/programmes/${this.programme_pid}/uploads/${this.id}`
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
    if (context.uploads) {
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
