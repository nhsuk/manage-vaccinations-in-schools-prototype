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

    const programmes = Object.values(data.programmes).map((programme) => {
      programme = new Programme(programme)

      // Cohorts in programme
      programme.cohorts = Object.values(data.cohorts)
        .filter((cohort) => cohort.programme_pid === programme.pid)
        .map((cohort) => new Cohort(cohort))

      // Patients in programme
      let records = []
      for (const cohort of programme.cohorts) {
        records = [...records, ...cohort.records]
      }

      programme.patients = Object.values(data.patients)
        .filter((patient) => records.includes(patient.record.nhsn))
        .map((patient) => new Patient(patient))

      // Sessions in programme
      programme.sessions = Object.values(data.sessions)
        .map((session) => new Session(session, data))
        .filter((session) => session.programmes.includes(programme.pid))
        .filter((session) => session.patients.length > 0)

      // Sessions in programme (grouped by status)
      programme.sessionsByStatus = Object.groupBy(
        programme.sessions,
        ({ status }) => status
      )

      // Recorded vaccinations in programme
      programme.vaccinations = Object.values(data.vaccinations)
        .filter((vaccination) => vaccination.programme_pid === programme.pid)
        .map((vaccination) => {
          vaccination = new Vaccination(vaccination)

          // Add record to vaccination
          vaccination.record = new Record(
            data.patients[vaccination.patient_uuid].record
          )

          return vaccination
        })

      programme.imports = Object.values(data.imports)
        .filter((_import) => _import.programme_pid === programme.pid)
        .map((_import) => new Import(_import, data))

      // Only mock issues with imported records if there are imports
      if (programme.imports.length) {
        programme.reviews = programme.imports[0].records
          .slice(0, 3)
          .map((record) => new Record(record))
      }

      return programme
    })

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
