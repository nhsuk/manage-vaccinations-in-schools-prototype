import { Batch } from './batch.js'
/**
 * @class Default Batch
 * @augments Batch
 * @param {object} options - Options
 * @param {object} [context] - Context
 */
export class DefaultBatch extends Batch {
  constructor(options, context) {
    super(options, context)

    this.session_id = options?.session_id
  }

  /**
   * Find all
   *
   * @param {object} context - Context
   * @returns {Array<DefaultBatch>|undefined} Default batches
   * @static
   */
  static findAll(context) {
    return Object.values(context.defaultBatches).map(
      (batch) => new DefaultBatch(batch, context)
    )
  }

  /**
   * Find one
   *
   * @param {string} id - Default batch ID
   * @param {object} context - Context
   * @returns {DefaultBatch|undefined} Default batch
   * @static
   */
  static findOne(id, context) {
    if (context?.defaultBatches?.[id]) {
      return new DefaultBatch(context.defaultBatches[id], context)
    }
  }

  /**
   * Delete
   *
   * @param {string} id - Default batch ID
   * @param {object} context - Context
   * @static
   */
  static delete(id, context) {
    delete context.defaultBatches[id]
  }

  /**
   * Add default batch to session
   *
   * @param {string} id - Batch ID
   * @param {string} session_id - Session ID
   * @param {object} context - Context
   */
  static addToSession(id, session_id, context) {
    const batch = Batch.findOne(id, context)
    delete batch?.context

    const defaultBatch = {
      ...batch,
      session_id
    }

    // Update context
    context.defaultBatches[id] = defaultBatch
  }
}
