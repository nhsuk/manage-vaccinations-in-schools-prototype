import { fakerEN_GB as faker } from '@faker-js/faker'

import schools from '../datasets/schools.js'
import { Patient } from '../models/patient.js'
import { formatDate, getDateValueDifference, today } from '../utils/date.js'

/**
 * @class Move
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} uuid - UUID
 * @property {Date} [createdAt] - Reported date
 * @property {Date} [updatedAt] - Updated date
 * @property {string} from - Current school URN (moving from)
 * @property {string} to - Proposed school URN (moving to)
 * @property {import('../enums.js').MoveSource} source - Reporting source
 * @property {boolean} ignored - Reported move is ignored
 * @property {string} patient_uuid - Patient UUID
 */
export class Move {
  constructor(options, context) {
    this.context = context
    this.uuid = options?.uuid || faker.string.uuid()
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.updatedAt = options?.updatedAt
      ? new Date(options.updatedAt)
      : undefined
    this.from = options?.from
    this.to = options?.to
    this.source = options?.source
    this.ignored = options?.ignored || false
    this.patient_uuid = options?.patient_uuid
  }

  /**
   * Get patient
   *
   * @returns {Patient|undefined} Patient
   */
  get patient() {
    try {
      if (this.patient_uuid) {
        return Patient.findOne(this.patient_uuid, this.context)
      }
    } catch (error) {
      console.error('Move.patient', error.message)
    }
  }

  get movement() {
    return `<span><span class="nhsuk-u-secondary-text-colour nhsuk-u-font-size-16">${this.source} updated</span><br>${this.formatted.from}<br><span class="nhsuk-u-secondary-text-colour nhsuk-u-font-size-16">to</span> ${this.formatted.to}</span>`
  }

  /**
   * Get formatted values
   *
   * @returns {object} Formatted values
   */
  get formatted() {
    return {
      createdAt: formatDate(this.createdAt, { dateStyle: 'long' }),
      from: schools[this.from]?.name || 'Unknown school',
      to: schools[this.to]?.name || 'Unknown school'
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} Namespace
   */
  get ns() {
    return 'move'
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/moves/${this.uuid}`
  }

  /**
   * Find all
   *
   * @param {object} context - Context
   * @returns {Array<Move>|undefined} Moves
   * @static
   */
  static findAll(context) {
    return Object.values(context.moves)
      .map((move) => new Move(move, context))
      .filter((move) => !move.ignored)
      .sort((a, b) => getDateValueDifference(a.createdAt, b.createdAt))
  }

  /**
   * Find one
   *
   * @param {string} uuid - Move UUID
   * @param {object} context - Context
   * @returns {Move|undefined} Move
   * @static
   */
  static findOne(uuid, context) {
    if (context?.moves?.[uuid]) {
      return new Move(context.moves[uuid], context)
    }
  }

  /**
   * Update
   *
   * @param {string} uuid - Move UUID
   * @param {object} updates - Updates
   * @param {object} context - Context
   * @returns {Move} Updated download
   * @static
   */
  static update(uuid, updates, context) {
    const updatedMove = Object.assign(this, updates)
    updatedMove.updatedAt = today()

    // Remove move context
    delete updatedMove.context

    // Delete original move (with previous UUID)
    delete context.moves[uuid]

    // Update context
    context.moves[updatedMove.uuid] = updatedMove

    return updatedMove
  }

  /**
   * Delete
   *
   * @param {string} uuid - Move UUID
   * @param {object} context - Context
   * @static
   */
  static delete(uuid, context) {
    delete context.moves[uuid]
  }

  /**
   * Ignore move
   *
   * @param {string} uuid - Move UUID
   * @param {object} context - Context
   */
  ignore(uuid, context) {
    Move.update(uuid, { ignored: true }, context)
  }

  /**
   * Switch patient’s school
   *
   * @param {string} uuid - Move UUID
   * @param {object} context - Context
   */
  switch(uuid, context) {
    const move = Move.findOne(uuid, context)

    context.patients[move.patient_uuid].school_urn = move.to

    Move.delete(uuid, context)
  }
}
