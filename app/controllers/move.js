import _ from 'lodash'

import { Move } from '../models/move.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const moveController = {
  readAll(request, response, next) {
    let { page, limit } = request.query
    const { data } = request.session

    let moves = Object.values(data.moves)
      .map((move) => new Move(move, data))
      .filter((move) => !move.ignore)

    // Sort
    moves = _.sortBy(moves, 'created')

    // Paginate
    page = parseInt(page) || 1
    limit = parseInt(limit) || 100

    response.locals.moves = moves
    response.locals.results = getResults(moves, page, limit)
    response.locals.pages = getPagination(moves, page, limit)

    next()
  },

  showAll(request, response) {
    response.render('move/list')
  },

  read(request, response, next) {
    const { uuid } = request.params
    const { moves } = response.locals

    const move = moves.find((move) => move.uuid === uuid)

    response.locals.move = move

    next()
  },

  show(request, response) {
    response.render('move/show')
  },

  update(request, response) {
    const { decision } = request.body
    const { data } = request.session
    const { __, move } = response.locals

    const updatedMove = new Move(move)

    if (decision === 'ignore') {
      updatedMove.ignore = true

      // Update session data
      data.moves[move.uuid] = updatedMove

      request.flash('success', __(`move.success.ignore`, { move }))
    } else {
      // Update session data
      data.records[move.record_nhsn].urn = updatedMove.to
      delete data.moves[move.uuid]

      request.flash('success', __(`move.success.update`, { move }))
    }

    response.redirect('/moves')
  }
}
