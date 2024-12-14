import { Vaccine } from '../models/vaccine.js'

export const vaccineController = {
  readAll(request, response, next) {
    const { data } = request.session

    response.locals.vaccines = Vaccine.readAll(data)

    next()
  },

  showAll(request, response) {
    response.render('vaccine/list')
  },

  read(request, response, next) {
    const { gtin } = request.params
    const { data } = request.session

    response.locals.vaccine = Vaccine.read(gtin, data)

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
    const { data } = request.session
    const { __, vaccine } = response.locals

    request.flash('success', __(`vaccine.success.delete`))

    vaccine.delete(data)

    response.redirect('/vaccines')
  }
}
