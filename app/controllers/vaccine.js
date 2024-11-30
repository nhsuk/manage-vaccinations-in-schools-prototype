import { Vaccine } from '../models/vaccine.js'

export const vaccineController = {
  readAll(request, response, next) {
    const { data } = request.session

    const vaccines = Object.values(data.vaccines).map(
      (vaccine) => new Vaccine(vaccine, data)
    )

    response.locals.vaccines = vaccines

    next()
  },

  showAll(request, response) {
    response.render('vaccine/list')
  },

  read(request, response, next) {
    const { gtin } = request.params
    const { vaccines } = response.locals

    const vaccine = vaccines.find((vaccine) => vaccine.gtin === gtin)

    response.locals.vaccine = vaccine

    next()
  },

  show(request, response) {
    response.render('vaccine/show')
  },

  action(type) {
    return (request, response) => {
      response.render('vaccine/action', { type })
    }
  },

  delete(request, response) {
    const { gtin } = request.params
    const { data } = request.session
    const { __ } = response.locals

    delete data.vaccines[gtin]

    request.flash('success', __(`vaccine.success.delete`))
    response.redirect('/vaccines')
  }
}
