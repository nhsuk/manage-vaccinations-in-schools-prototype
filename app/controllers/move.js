import _ from 'lodash'

import { Move } from '../models/move.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const moveController = {
  read(request, response, next, move_uuid) {
    response.locals.move = Move.read(move_uuid, request.session.data)

    next()
  },

  readAll(request, response, next) {
    let moves = Move.findAll(request.session.data)

    // Sort
    moves = _.sortBy(moves, 'createdAt')

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

    request.flash('success', __(`move.${decision}.success`, { move }))

    // Clean up session data
    delete data.decision

    // Ignore or switch schools
    decision === 'ignore' ? move.ignore(data) : move.switch(data)

    response.redirect('/moves')
  }
}
