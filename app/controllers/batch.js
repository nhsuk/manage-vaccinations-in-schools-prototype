import { Batch } from '../models/batch.js'
import { Session } from '../models/session.js'

export const batchController = {
  read(request, response, next, batch_id) {
    const batch = Batch.read(batch_id, request.session.data)

    response.locals.batch = batch
    response.locals.paths = {
      back: '/vaccines',
      next: '/vaccines'
    }

    next()
  },

  form(type) {
    return (request, response) => {
      response.render('batch/form', { type })
    }
  },

  action(type) {
    return (request, response) => {
      response.render('batch/action', { type })
    }
  },

  create(request, response) {
    const { snomed } = request.params
    const { data } = request.session
    const { __ } = response.locals

    const batch = new Batch({
      ...request.body.batch,
      vaccine_snomed: snomed
    })

    request.flash('success', __(`batch.new.success`, { batch }))

    batch.create(batch, data)

    response.redirect('/vaccines')
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

  archive(request, response) {
    const { data } = request.session
    const { __, batch } = response.locals

    request.flash('success', __(`batch.archive.success`, { batch }))

    batch.archive(data)

    // Find session with batch set as default
    const sessionsWithDefaultBatch = Session.readAll(data).filter(
      ({ defaultBatch_ids }) =>
        Object.entries(defaultBatch_ids).map(
          ([, batch_id]) => batch_id === batch.id
        )
    )

    // Remove batch from session defaults
    for (const session of sessionsWithDefaultBatch) {
      delete session.defaultBatch_ids[batch.vaccine_snomed]
    }

    response.redirect('/vaccines')
  }
}
