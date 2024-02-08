import { Batch } from '../models/batch.js'
import { Vaccine } from '../models/vaccine.js'

export const vaccineController = {
  action(type) {
    return (request, response) => {
      response.render('vaccines/action', { type })
    }
  },

  list(request, response) {
    const { data } = request.session

    response.render('vaccines/list', {
      vaccines: Object.values(data.vaccines).map((vaccine) => {
        vaccine = new Vaccine(vaccine)

        vaccine.batches = Object.values(data.batches)
          .filter((batch) => batch.vaccine_gtin === vaccine.gtin)
          .map((batch) => new Batch(batch))

        return vaccine
      })
    })
  },

  show(request, response) {
    response.render('vaccines/show')
  },

  read(request, response, next) {
    const { gtin } = request.params
    const { data } = request.session

    request.app.locals.vaccine = new Vaccine(data.vaccines[gtin])

    next()
  },

  delete(request, response) {
    const { vaccine } = request.app.locals
    const { data } = request.session
    const { __ } = response.locals

    delete data.vaccines[vaccine.gtin]

    request.flash('success', __(`vaccine.success.delete`))
    response.redirect('/vaccines')
  }
}
