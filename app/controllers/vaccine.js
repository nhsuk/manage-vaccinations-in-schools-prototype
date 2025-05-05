import { Vaccine } from '../models/vaccine.js'

export const vaccineController = {
  read(request, response, next, snomed) {
    response.locals.vaccine = Vaccine.read(snomed, request.session.data)

    next()
  },

  readAll(request, response, next) {
    response.locals.vaccines = Vaccine.readAll(request.session.data)

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
