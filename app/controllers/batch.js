import { Batch } from '../models/batch.js'
import { Session } from '../models/session.js'

export const batchController = {
  show(request, response) {
    const { form } = request.params

    response.render('batch/form', { form })
  },

  create(request, response) {
    const { gtin } = request.params
    const { data } = request.session
    const { __ } = response.locals

    const batch = new Batch({
      ...request.body.batch,
      vaccine_gtin: gtin
    })

    request.flash('success', __(`batch.new.success`, { batch }))

    batch.create(batch, data)

    response.redirect('/vaccines')
  },

  read(request, response, next) {
    const { id } = request.params
    const { data } = request.session

    response.locals.batch = Batch.read(id, data)
    response.locals.paths = {
      back: `/vaccines`,
      next: `/vaccines`
    }

    next()
  },

  update(request, response) {
    const { data } = request.session
    const { __, batch, paths } = response.locals

    // Clean up session data
    delete data.batch

    // Update session data
    batch.update(request.body.batch, data)

    request.flash('success', __(`batch.edit.success`, { batch }))

    response.redirect(paths.next)
  },

  action(type) {
    return (request, response) => {
      response.render('batch/action', { type })
    }
  },

  archive(request, response) {
    const { id } = request.params
    const { data } = request.session
    const { __, batch } = response.locals

    request.flash('success', __(`batch.archive.success`, { batch }))

    batch.archive(data)

    // Find session with batch set as default
    const sessionsWithDefaultBatch = Session.readAll(data).filter(
      ({ defaultBatch_ids }) =>
        Object.entries(defaultBatch_ids).map(([, batch_id]) => batch_id === id)
    )

    // Remove batch from session defaults
    for (const session of sessionsWithDefaultBatch) {
      delete session.defaultBatch_ids[batch.vaccine_gtin]
    }

    response.redirect('/vaccines')
  }
}
