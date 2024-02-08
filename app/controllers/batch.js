import { Batch } from '../models/batch.js'

export const batchController = {
  edit(request, response) {
    response.render('batch/edit')
  },

  new(request, response) {
    response.render('batch/new')
  },

  create(request, response) {
    const { gtin } = request.params
    const { __ } = response.locals

    const batch = new Batch({
      ...request.body.batch,
      vaccine_gtin: gtin
    })

    request.session.data.batches[batch.id] = batch

    request.flash('success', __(`batch.success.create`, { batch }))
    response.redirect('/vaccines')
  },

  read(request, response, next) {
    const { id } = request.params
    const { data } = request.session

    response.locals.batch = new Batch(data.batches[id])

    next()
  },

  update(request, response) {
    const { data } = request.session
    const { __ } = response.locals

    const batch = new Batch({
      ...response.locals.batch,
      ...request.body.batch
    })

    batch.expiresDate = request.body.batch.expiresDate

    data.batches[batch.id] = batch

    request.flash('success', __(`batch.success.update`, { batch }))
    response.redirect(`/vaccines`)
  }
}
