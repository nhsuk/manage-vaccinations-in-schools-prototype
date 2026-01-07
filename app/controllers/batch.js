import { Batch, DefaultBatch } from '../models.js'

export const batchController = {
  read(request, response, next, batch_id) {
    const batch = Batch.findOne(batch_id, request.session.data)

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
    const { vaccine_snomed } = request.params
    const { data } = request.session
    const { __ } = response.locals

    const batch = Batch.create(
      {
        ...request.body.batch,
        vaccine_snomed
      },
      data
    )

    request.flash('success', __(`batch.new.success`, { batch }))

    response.redirect('/vaccines')
  },

  update(request, response) {
    const { batch_id } = request.params
    const { data } = request.session
    const { __, paths } = response.locals

    // Clean up session data
    delete data.batch

    // Update session data
    const batch = Batch.update(batch_id, request.body.batch, data)

    request.flash('success', __(`batch.edit.success`, { batch }))

    response.redirect(paths.next)
  },

  archive(request, response) {
    const { batch_id } = request.params
    const { data } = request.session
    const { __ } = response.locals

    // Remove from default batches
    DefaultBatch.delete(batch_id, data)

    // Archive batch
    const batch = Batch.archive(batch_id, data)

    request.flash('success', __(`batch.archive.success`, { batch }))

    response.redirect('/vaccines')
  }
}
