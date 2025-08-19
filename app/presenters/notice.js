import { en } from '../locales/en.js'
import { Notice } from '../models/notice.js'
import { formatDate } from '../utils/date.js'

/**
 * @class NoticePresenter
 * @param {Notice} notice - Notice
 */
export class NoticePresenter {
  #notice
  #context

  constructor(notice, context) {
    this.#notice = notice
    this.#context = context

    this.uuid = notice.uuid
    this.uri = notice.uri
    this.archivedAt = notice.archivedAt
    this.patient = notice.patient
  }

  /**
   * Present notice
   *
   * @param {string} uuid - Notice UUID
   * @param {object} context - Context
   * @returns {NoticePresenter|undefined} Notice
   * @static
   */
  static forOne(uuid, context) {
    const notice = Notice.findOne(uuid, context)

    return new NoticePresenter(notice, context)
  }

  /**
   * Present notices
   *
   * @param {object} context - Context
   * @returns {Array<NoticePresenter>|undefined} Notices
   * @static
   */
  static forAll(context) {
    const notices = Notice.findAll(context)

    return Object.values(notices).map(
      (notice) => new NoticePresenter(notice, context)
    )
  }

  /**
   * Get formatted created date
   *
   * @returns {string} Formatted created date
   */
  get createdAt() {
    return formatDate(this.#notice.createdAt, { dateStyle: 'long' })
  }

  /**
   * Get table row for display in templates
   *
   * @returns {Array} Table row cells
   */
  get tableRow() {
    return [
      {
        header: en.patient.label,
        html: this.patient.link.fullNameAndNhsn,
        attributes: { width: '20%' }
      },
      {
        header: en.notice.createdAt.label,
        html: this.createdAt,
        attributes: { width: '20%' }
      },
      {
        header: en.notice.label,
        html: this.patient.notice.name || 'Not provided'
      }
    ]
  }
}
