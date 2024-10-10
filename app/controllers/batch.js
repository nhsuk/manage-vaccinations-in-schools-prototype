import { Batch } from '../models/batch.js'

export const batchController = {
  show(request, response) {
    const { form } = request.params

    response.render('batch/form', { form })
  },

  create(request, response) {
    const { gtin } = request.params
    const { __ } = response.locals

    const batch = new Batch({
      ...request.body.batch,
      vaccine_gtin: gtin
    })

    // Add to session data
    request.session.data.batches[batch.id] = batch

    request.flash('success', __(`batch.success.create`, { batch }))

    response.redirect('/vaccines')
  },

  read(request, response, next) {
    const { id } = request.params
    const { data } = request.session

    response.locals.batch = new Batch(data.batches[id])

    response.locals.paths = {
      back: `/vaccines`,
      next: `/vaccines`
    }

    next()
  },

  update(request, response) {
    const { id } = request.params
    const { data } = request.session
    const { __, batch, paths } = response.locals

    const updatedBatch = new Batch({
      ...batch,
      ...request.body.batch
    })

    // Update session data
    delete data.batches[id]
    data.batches[updatedBatch.id] = updatedBatch

    // Clean up session data
    delete data.batch

    request.flash(
      'success',
      __(`batch.success.update`, { batch: updatedBatch })
    )

    response.redirect(paths.next)
  }
}
