import { Cohort } from '../models/cohort.js'
import { Import } from '../models/import.js'
import { Patient } from '../models/patient.js'
import { Programme } from '../models/programme.js'
import { Record } from '../models/record.js'
import { Session } from '../models/session.js'
import { Vaccination } from '../models/vaccination.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { formatYearGroup } from '../utils/string.js'

export const programmeController = {
  readAll(request, response, next) {
    const { data } = request.session

    const programmes = Object.values(data.programmes).map(
      (programme) => new Programme(programme, data)
    )

    response.locals.programmes = programmes

    next()
  },

  showAll(request, response) {
    response.render('programme/list')
  },

  read(request, response, next) {
    const { pid } = request.params
    const { programmes } = response.locals

    const programme = programmes.find((programme) => programme.pid === pid)

    request.app.locals.programme = programme

    next()
  },

  show(request, response) {
    const { programme } = request.app.locals
    const view = request.params.view || 'show'
    let { page, limit } = request.query
    const { patients, vaccinations } = programme

    page = parseInt(page) || 1
    limit = parseInt(limit) || 100

    // Paginate
    if (view === 'vaccinations') {
      response.locals.results = getResults(vaccinations, page, limit)
      response.locals.pages = getPagination(vaccinations, page, limit)
    } else if (view === 'patients') {
      response.locals.cohortItems = programme.cohorts
        .map((cohort) => new Cohort(cohort))
        .map((cohort) => ({
          text: formatYearGroup(cohort.yearGroup),
          value: cohort.yearGroup
        }))
      response.locals.results = getResults(patients, page, limit)
      response.locals.pages = getPagination(patients, page, limit)
    }

    response.render(`programme/${view}`)
  }
}
