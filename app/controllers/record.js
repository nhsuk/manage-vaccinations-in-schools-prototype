import _ from 'lodash'

import { Record } from '../models/record.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const recordController = {
  read(request, response, next, nhsn) {
    response.locals.record = Record.read(nhsn, request.session.data)

    next()
  },

  readAll(request, response, next) {
    let records = Record.readAll(request.session.data)

    // Sort
    records = _.sortBy(records, 'lastName')

    response.locals.records = records
    response.locals.results = getResults(records, request.query)
    response.locals.pages = getPagination(records, request.query)

    next()
  },

  list(request, response) {
    response.render('record/list')
  },

  show(request, response) {
    response.render('record/show')
  }
}
