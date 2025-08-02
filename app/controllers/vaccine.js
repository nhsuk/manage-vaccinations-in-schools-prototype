import { Batch } from '../models/batch.js'
import { Vaccine } from '../models/vaccine.js'

export const vaccineController = {
  read(request, response, next, snomed) {
    response.locals.vaccine = Vaccine.show(snomed, request.session.data)

    next()
  },

  readAll(request, response, next) {
    response.locals.vaccines = Vaccine.showAll(request.session.data).map(
      (vaccine) => {
        vaccine.batches = Batch.showAll(vaccine)

        return vaccine
      }
    )

    next()
  },

  show(request, response) {
    response.render('vaccine/show')
  },

  list(request, response) {
    response.render('vaccine/list')
  },

  action(type) {
    return (request, response) => {
      response.render('vaccine/action', { type })
    }
  },

  delete(request, response) {
    const { data } = request.session
    const { __, vaccine } = response.locals

    request.flash('success', __(`vaccine.success.delete`))

    vaccine.delete(data)

    response.redirect('/vaccines')
  }
}
