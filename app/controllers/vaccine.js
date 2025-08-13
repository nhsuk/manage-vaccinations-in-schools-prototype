import { Vaccine } from '../models/vaccine.js'

export const vaccineController = {
  read(request, response, next, snomed) {
    response.locals.vaccine = Vaccine.findOne(snomed, request.session.data)

    next()
  },

  readAll(request, response, next) {
    response.locals.vaccines = Vaccine.findAll(request.session.data)

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
    const { snomed } = request.params
    const { data } = request.session
    const { __ } = response.locals

    Vaccine.delete(snomed, data)

    request.flash('success', __(`vaccine.delete.success`))

    response.redirect('/vaccines')
  }
}
