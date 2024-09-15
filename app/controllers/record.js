import { Record } from '../models/record.js'
import { Vaccination } from '../models/vaccination.js'

export const recordController = {
  readAll(request, response, next) {
    const { data } = request.session

    const records = Object.values(data.records).map((record) => {
      record = new Record(record)

      // Add complete vaccination record
      record.vaccinations = record.vaccinations.map(
        (uuid) => new Vaccination(data.vaccinations[uuid])
      )

      return record
    })

    response.locals.records = records

    next()
  },

  showAll(request, response) {
    response.render('records/list')
  },

  read(request, response, next) {
    const { nhsn } = request.params
    const { records } = response.locals

    const record = records.find((record) => record.nhsn === nhsn)

    response.locals.record = record

    next()
  },

  show(request, response) {
    response.render('records/show')
  }
}
