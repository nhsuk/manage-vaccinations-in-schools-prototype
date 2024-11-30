import { Batch } from '../models/batch.js'

export const defaultBatchController = {
  read(request, response, next) {
    const { gtin } = request.params
    const { data } = request.session

    const batchItems = Object.values(data.batches)
      .map((batch) => new Batch(batch, data))
      .filter((batch) => batch.vaccine.gtin === gtin)

    response.locals.vaccine = batchItems[0].vaccine
    response.locals.batchItems = batchItems

    next()
  },

  show(request, response) {
    response.render('default-batch/edit')
  },

  update(request, response) {
    const { session } = request.app.locals

    response.redirect(`${session.uri}/capture`)
  }
}
