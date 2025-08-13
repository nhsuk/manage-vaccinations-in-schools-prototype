import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatDate, getDateValueDifference, today } from '../utils/date.js'

import { Patient } from './patient.js'

/**
 * @class Notice
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} uuid - UUID
 * @property {Date} [createdAt] - Created date
 * @property {Date} [archivedAt] - Archived date
 * @property {import('../enums.js').NoticeType} type - Notice type
 * @property {string} patient_uuid - Patient notice applies to
 */
export class Notice {
  constructor(options, context) {
    this.context = context
    this.uuid = options.uuid || faker.string.uuid()
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.archivedAt = options?.archivedAt && new Date(options.archivedAt)
    this.type = options.type
    this.patient_uuid = options.patient_uuid
  }

  /**
   * Get patient
   *
   * @returns {Patient} Patient
   */
  get patient() {
    try {
      const patient = this.context?.patients[this.patient_uuid]
      if (patient) {
        return new Patient(patient)
      }
    } catch (error) {
      console.error('Notice.patient', error.message)
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} Formatted values
   */
  get formatted() {
    return {
      createdAt: formatDate(this.createdAt, { dateStyle: 'long' })
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} Namespace
   */
  get ns() {
    return 'notice'
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/uploads/notices/${this.uuid}`
  }

  /**
   * Find all
   *
   * @param {object} context - Context
   * @returns {Array<Notice>|undefined} Notices
   * @static
   */
  static findAll(context) {
    return Object.values(context.notices)
      .map((notice) => new Notice(notice, context))
      .sort((a, b) => getDateValueDifference(a.createdAt, b.createdAt))
  }

  /**
   * Find one
   *
   * @param {string} uuid - Notice UUID
   * @param {object} context - Context
   * @returns {Notice|undefined} Notice
   * @static
   */
  static findOne(uuid, context) {
    if (context?.notices?.[uuid]) {
      return new Notice(context.notices[uuid], context)
    }
  }

  /**
   * Archive
   *
   * @param {string} id - Notice ID
   * @param {object} context - Context
   * @returns {Notice} Notice
   * @static
   */
  static archive(id, context) {
    const archivedNotice = Notice.findOne(id, context)
    archivedNotice.archivedAt = new Date()

    // Remove batch context
    delete archivedNotice.context

    // Update context
    context.notices[id] = archivedNotice

    return archivedNotice
  }
}
