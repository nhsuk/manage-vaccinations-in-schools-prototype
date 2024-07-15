import { Record } from '../models/record.js'
import { Vaccination } from '../models/vaccination.js'

export const recordController = {
  list(request, response) {
    const { data } = request.session

    response.render('records/list', {
      records: Object.values(data.records).map((record) => new Record(record))
    })
  },

  show(request, response) {
    response.render('records/show')
  },

  read(request, response, next) {
    const { nhsn } = request.params
    const { data } = request.session

    const record = new Record(data.records[nhsn])

    // Add complete vaccination record
    record.vaccinations = record.vaccinations.map(
      (uuid) => new Vaccination(data.vaccinations[uuid])
    )

    response.locals.record = record

    next()
  }
}
