import { Programme } from '../models/programme.js'

export const programmeController = {
  read(request, response, next, programme_id) {
    response.locals.programme = Programme.findOne(
      programme_id,
      request.session.data
    )

    next()
  },

  readAll(request, response, next) {
    response.locals.programmes = Programme.findAll(request.session.data)

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`programme/${view}`)
  },

  list(request, response) {
    response.render('programme/list')
  }
}
