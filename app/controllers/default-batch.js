import { Batch } from '../models/batch.js'
import { Vaccine } from '../models/vaccine.js'

export const defaultBatchController = {
  read(request, response, next) {
    const { gtin } = request.params
    const { data } = request.session

    const vaccine = new Vaccine(data.vaccines[gtin])
    const batchItems = Object.values(data.batches)
      .map((batch) => new Batch(batch))
      .filter((batch) => batch.vaccine.gtin === gtin)

    response.locals.vaccine = vaccine
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
