import _ from 'lodash'

import { Record } from '../models/record.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const recordController = {
  readAll(request, response, next) {
    let { page, limit } = request.query
    const { data } = request.session

    let records = Record.readAll(data)

    // Sort
    records = _.sortBy(records, 'lastName')

    // Paginate
    page = parseInt(page) || 1
    limit = parseInt(limit) || 200

    response.locals.records = records
    response.locals.results = getResults(records, page, limit)
    response.locals.pages = getPagination(records, page, limit)

    next()
  },

  showAll(request, response) {
    response.render('record/list')
  },

  read(request, response, next) {
    const { nhsn } = request.params
    const { data } = request.session

    response.locals.record = Record.read(nhsn, data)

    next()
  },

  show(request, response) {
    response.render('record/show')
  }
}
