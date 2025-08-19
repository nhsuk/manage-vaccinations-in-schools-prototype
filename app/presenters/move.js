import schools from '../datasets/schools.js'
import { en } from '../locales/en.js'
import { Move } from '../models/move.js'
import { formatDate } from '../utils/date.js'

/**
 * @class MovePresenter
 * @param {Move} move - Move
 */
export class MovePresenter {
  #move
  #context

  constructor(move, context) {
    this.#move = move
    this.#context = context

    this.uuid = move.uuid
    this.uri = move.uri
    this.source = move.source
    this.patient = move.patient
  }

  /**
   * Present move
   *
   * @param {string} uuid - Move UUID
   * @param {object} context - Context
   * @returns {MovePresenter|undefined} Move
   * @static
   */
  static forOne(uuid, context) {
    const move = Move.findOne(uuid, context)

    return new MovePresenter(move, context)
  }

  /**
   * Present moves
   *
   * @param {object} context - Context
   * @returns {Array<MovePresenter>|undefined} Moves
   * @static
   */
  static forAll(context) {
    const moves = Move.findAll(context)

    return Object.values(moves).map((move) => new MovePresenter(move, context))
  }

  /**
   * Get formatted created date
   *
   * @returns {string} Formatted created date
   */
  get createdAt() {
    return formatDate(this.#move.createdAt, { dateStyle: 'long' })
  }

  /**
   * Get school moving from
   *
   * @returns {string} School moving from
   */
  get fromSchoolName() {
    return schools[this.#move.from_urn]?.name || 'Unknown school'
  }

  /**
   * Get school moving to
   *
   * @returns {string} School moving to
   */
  get toSchoolName() {
    return schools[this.#move.to_urn]?.name || 'Unknown school'
  }

  /**
   * Get summary
   *
   * @returns {string} Summary
   */
  get summary() {
    return `<span><span class="nhsuk-u-secondary-text-colour nhsuk-u-font-size-16">${this.#move.source} updated</span><br>${this.fromSchoolName}<br><span class="nhsuk-u-secondary-text-colour nhsuk-u-font-size-16">to</span> ${this.toSchoolName}</span>`
  }

  /**
   * Get table row for display in templates
   *
   * @returns {Array} Table row cells
   */
  get tableRow() {
    return [
      {
        header: en.move.createdAt.label,
        html: this.createdAt
      },
      {
        header: en.child.label,
        text: this.patient.fullName
      },
      {
        header: en.move.label,
        html: this.summary
      }
    ]
  }
}
