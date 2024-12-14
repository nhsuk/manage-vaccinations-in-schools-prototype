import { fakerEN_GB as faker } from '@faker-js/faker'

import schools from '../datasets/schools.js'
import { Patient } from '../models/patient.js'
import { formatDate, getToday } from '../utils/date.js'

export class MoveSource {
  static Cohort = 'Cohort record'
  static Consent = 'Consent response'
  static School = 'Class list'
  static External = 'Another SAIS team'
}

/**
 * @class Move
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} uuid - UUID
 * @property {Date} [created] - Reported date
 * @property {Date} [updated] - Updated date
 * @property {string} from - Current school URN (moving from)
 * @property {string} to - Proposed school URN (moving to)
 * @property {MoveSource} source - Reporting source
 * @property {boolean} ignored - Reported move is ignored
 * @property {string} patient_uuid - Patient UUID
 */
export class Move {
  constructor(options, context) {
    this.context = context
    this.uuid = options?.uuid || faker.string.uuid()
    this.created = options?.created ? new Date(options.created) : getToday()
    this.updated = options?.updated ? new Date(options.updated) : undefined
    this.from = options?.from
    this.to = options?.to
    this.source = options?.source
    this.ignored = options?.ignored || false
    this.patient_uuid = options?.patient_uuid
  }

  /**
   * Get patient
   *
   * @returns {Patient|undefined} - Patient
   */
  get patient() {
    try {
      const patient = this.context?.patients[this.patient_uuid]
      if (patient) {
        return new Patient(patient, this.context)
      }
    } catch (error) {
      console.error('Move.patient', error.message)
    }
  }

  get movement() {
    return `<span><span class="nhsuk-u-secondary-text-color nhsuk-u-font-size-16">${this.source} updated</span><br>${this.formatted.from}<br><span class="nhsuk-u-secondary-text-color nhsuk-u-font-size-16">to</span> ${this.formatted.to}</span>`
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      created: formatDate(this.created, { dateStyle: 'long' }),
      from: schools[this.from].name,
      to: schools[this.to].name
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'move'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/moves/${this.uuid}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Move>|undefined} Moves
   * @static
   */
  static readAll(context) {
    return Object.values(context.moves)
      .map((move) => new Move(move, context))
      .filter((move) => !move.ignored)
  }

  /**
   * Read
   *
   * @param {string} uuid - Move UUID
   * @param {object} context - Context
   * @returns {Move|undefined} Move
   * @static
   */
  static read(uuid, context) {
    if (context?.moves) {
      return new Move(context.moves[uuid], context)
    }
  }

  /**
   * Update
   *
   * @param {object} updates - Updates
   * @param {object} context - Context
   */
  update(updates, context) {
    this.updated = new Date()

    // Remove move context
    delete this.context

    // Delete original move (with previous UUID)
    delete context.moves[this.uuid]

    // Update context
    const updatedMove = Object.assign(this, updates)
    context.moves[updatedMove.uuid] = updatedMove
  }

  /**
   * Delete
   *
   * @param {object} context - Context
   */
  delete(context) {
    delete context.moves[this.uuid]
  }

  /**
   * Ignore move
   *
   * @param {object} context - Context
   */
  ignore(context) {
    this.update({ ignored: true }, context)
  }

  /**
   * Switch patient’s school
   *
   * @param {object} context - Context
   */
  switch(context) {
    context.patients[this.patient_uuid].school_urn = this.to

    this.delete(context)
  }
}
