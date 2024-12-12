import _ from 'lodash'

import { Record } from '../models/record.js'
import { getResults, getPagination } from '../utils/pagination.js'

export const recordController = {
  readAll(request, response, next) {
    let { page, limit } = request.query
    const { data } = request.session

    let records = Object.values(data.records).map(
      (record) => new Record(record, data)
    )

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
    const { records } = response.locals

    const record = records.find((record) => record.nhsn === nhsn)

    response.locals.record = record

    next()
  },

  show(request, response) {
    response.render('record/show')
  }
}
