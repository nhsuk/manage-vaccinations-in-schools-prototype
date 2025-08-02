import { Vaccine } from '../models/vaccine.js'
import { VaccinePresenter } from '../presenters/vaccine.js'

export const vaccineController = {
  read(request, response, next, vaccine_snomed) {
    response.locals.vaccine = VaccinePresenter.forOne(
      vaccine_snomed,
      request.session.data
    )

    next()
  },

  readAll(request, response, next) {
    response.locals.vaccines = VaccinePresenter.forAll(request.session.data)

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
    const { vaccine_snomed } = request.params
    const { data } = request.session
    const { __ } = response.locals

    Vaccine.delete(vaccine_snomed, data)

    request.flash('success', __(`vaccine.delete.success`))

    response.redirect('/vaccines')
  }
}
