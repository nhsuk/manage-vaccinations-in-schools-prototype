import _ from 'lodash'

import { Move } from '../models/move.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const moveController = {
  readAll(request, response, next) {
    const { data } = request.session

    let moves = Move.readAll(data)

    // Sort
    moves = _.sortBy(moves, 'createdAt')

    response.locals.moves = moves
    response.locals.results = getResults(moves, request.query)
    response.locals.pages = getPagination(moves, request.query)

    next()
  },

  showAll(request, response) {
    response.render('move/list')
  },

  read(request, response, next) {
    const { uuid } = request.params
    const { data } = request.session

    response.locals.move = Move.read(uuid, data)

    next()
  },

  show(request, response) {
    response.render('move/show')
  },

  update(request, response) {
    const { decision } = request.body
    const { data } = request.session
    const { __, move } = response.locals

    // Clean up session data
    delete data.decision

    // Ignore or switch schools
    decision === 'ignore' ? move.ignore(data) : move.switch(data)

    request.flash('success', __(`move.${decision}.success`, { move }))

    response.redirect('/moves')
  }
}
