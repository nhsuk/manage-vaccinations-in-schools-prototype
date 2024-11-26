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
      ...request.body.batch,
      updated: new Date().toISOString()
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
  },

  action(type) {
    return (request, response) => {
      response.render('batch/action', { type })
    }
  },

  delete(request, response) {
    const { id } = request.params
    const { data } = request.session
    const { __, batch } = response.locals

    // Remove from default batches
    if (data.token?.batch) {
      for (const [session_id, gtins] of Object.entries(data.token.batch)) {
        for (const [gtin, batches] of Object.entries(gtins)) {
          if (batches.includes(batch.id)) {
            data.token.batch[session_id][gtin] = data.token.batch[session_id][
              gtin
            ].filter((batch) => batch !== id)
          }
        }
      }
    }

    // Remove from session data
    delete data.batches[id]

    request.flash('success', __(`batch.success.delete`))
    response.redirect('/vaccines')
  }
}
