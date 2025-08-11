import { DefaultBatch } from '../models/default-batch.js'
import { Session } from '../models/session.js'
import { formatMonospace } from '../utils/string.js'

/**
 * @class DefaultBatchPresenter
 * @param {DefaultBatch} defaultBatch - Batch
 * @param {object} [context] - Context
 */
export class DefaultBatchPresenter {
  #defaultBatch
  #context

  constructor(defaultBatch, context) {
    this.#defaultBatch = defaultBatch
    this.#context = context

    this.session_id = defaultBatch.session_id
    this.vaccine_snomed = defaultBatch.vaccine_snomed
  }

  /**
   * Present default batch
   *
   * @param {string} id - Default batch ID
   * @param {object} context - Context
   * @returns {DefaultBatchPresenter|undefined} Default batch
   * @static
   */
  static forOne(id, context) {
    const batch = DefaultBatch.findOne(id, context)

    return new DefaultBatchPresenter(batch, context)
  }

  /**
   * Present default batches
   *
   * @param {object} context - Context
   * @returns {Array<DefaultBatchPresenter>|undefined} Default batch
   * @static
   */
  static forAll(context) {
    const batches = DefaultBatch.findAll(context)

    return Object.values(batches).map(
      (batch) => new DefaultBatchPresenter(batch, context)
    )
  }

  /**
   * Get formatted ID
   *
   * @returns {string} string - Formatted ID
   */
  get id() {
    return formatMonospace(this.#defaultBatch.id)
  }

  /**
   * Get session this default batch belongs to
   *
   * @returns {Session} Session
   */
  get session() {
    return this.#defaultBatch?.session_id
      ? Session.findOne(this.#defaultBatch.session_id, this.#context)
      : null
  }
}
