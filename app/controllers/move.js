import { MovePresenter } from '../presenters/move.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const moveController = {
  read(request, response, next, move_uuid) {
    response.locals.move = MovePresenter.forOne(move_uuid, request.session.data)

    next()
  },

  readAll(request, response, next) {
    const moves = MovePresenter.forAll(request.session.data)

    response.locals.moves = moves
    response.locals.results = getResults(moves, request.query)
    response.locals.pages = getPagination(moves, request.query)

    next()
  },

  show(request, response) {
    response.render('move/show')
  },

  list(request, response) {
    response.render('move/list')
  },

  update(request, response) {
    const { decision } = request.body
    const { data } = request.session
    const { __, move } = response.locals

    // Clean up session data
    delete data.decision

    // Ignore or switch schools
    decision === 'ignore'
      ? move.ignore(move.uuid, data)
      : move.switch(move.uuid, data)

    request.flash('success', __(`move.${decision}.success`, { move }))

    response.redirect('/moves')
  }
}
