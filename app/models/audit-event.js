import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatDate, today } from '../utils/date.js'
import { formatTag } from '../utils/string.js'

import { Programme } from './programme.js'
import { User } from './user.js'

/**
 * @readonly
 * @enum {string}
 */
export const EventType = {
  Select: 'Select',
  Invite: 'Invite',
  Remind: 'Remind',
  Consent: 'Consent',
  Screen: 'Screen',
  Register: 'Register',
  Record: 'Record',
  Notice: 'Notice'
}

/**
 * @class Audit event
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} uuid - UUID
 * @property {Date} [createdAt] - Created date
 * @property {string} [createdBy_uid] - User who created event
 * @property {EventType} type - Activity type
 * @property {string} name - Name
 * @property {string} [note] - Note
 * @property {string} [outcome] - Outcome for activity type
 * @property {Array<string>} [programme_pids] - Programme PIDs
 */
export class AuditEvent {
  constructor(options, context) {
    this.context = context
    this.uuid = options.uuid || faker.string.uuid()
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdBy_uid = options?.createdBy_uid
    this.type = options.type
    this.name = options.name
    this.note = options.note
    this.outcome = options?.outcome
    this.programme_pids = options?.programme_pids
  }

  /**
   * Get user who created event
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
   * Get programmes event relates to
   *
   * @returns {Array<Programme>} - Programmes
   */
  get programmes() {
    if (this.context?.programmes && this.programme_pids) {
      return this.programme_pids.map(
        (pid) => new Programme(this.context?.programmes[pid], this.context)
      )
    }

    return []
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    const datetime = formatDate(this.createdAt, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    return {
      createdAt: formatDate(this.createdAt, { dateStyle: 'long' }),
      createdAtAndBy: this.createdBy
        ? [datetime, this.createdBy.link.fullName].join(` · `)
        : datetime,
      datetime,
      note: this.note && `<blockquote>${this.note}</blockquote>`,
      programmes: this.programmes
        .flatMap(({ name }) => formatTag({ colour: 'white', text: name }))
        .join(' ')
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'event'
  }
}
