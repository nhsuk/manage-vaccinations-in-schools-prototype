import { Batch } from '../models/batch.js'
import { DefaultBatch } from '../models/default-batch.js'

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

    // Remove from default batches
    const defaultBatch = DefaultBatch.read(batch.id, data)
    defaultBatch.delete(data)

    response.redirect('/vaccines')
  }
}
