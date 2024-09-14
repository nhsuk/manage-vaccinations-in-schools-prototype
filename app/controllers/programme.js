import { Cohort } from '../models/cohort.js'
import { Programme } from '../models/programme.js'
import { Session } from '../models/session.js'
import { Upload } from '../models/upload.js'
import { getVaccinations } from '../utils/vaccination.js'

export const programmeController = {
  list(request, response) {
    const { data } = request.session

    const programmes = Object.values(data.programmes).map(
      (programme) => new Programme(programme)
    )

    response.locals.programmes = programmes

    response.render('programme/list')
  },

  show(request, response) {
    response.render('programme/show')
  },

  cohorts(request, response) {
    response.render('programme/cohorts')
  },

  reviews(request, response) {
    response.render('programme/reviews')
  },

  sessions(request, response) {
    response.render('programme/sessions')
  },

  uploads(request, response) {
    const { pid } = request.params
    const { data } = request.session

    response.locals.uploads = Object.values(data.uploads)
      .filter((upload) => upload.programme_pid === pid)
      .map((upload) => new Upload(upload))

    response.render('programme/uploads')
  },

  vaccinations(request, response) {
    response.render('programme/vaccinations')
  },

  read(request, response, next) {
    const { pid } = request.params
    const { data } = request.session

    const programme = new Programme(data.programmes[pid])
    const cohorts = Object.values(data.cohorts)
      .filter((cohort) => programme.cycle === cohort.cycle)
      .filter((cohort) => programme.yearGroups.includes(cohort.yearGroup))
      .map((cohort) => new Cohort(cohort))

    let totalCohort = 0
    for (const cohort of cohorts) {
      totalCohort = totalCohort + cohort.records.length
    }

    response.locals.programme = programme
    response.locals.cohorts = cohorts
    response.locals.totalCohort = totalCohort
    response.locals.sessions = Object.values(data.sessions)
      .filter((session) => session.programmes.includes(programme.pid))
      .map((session) => {
        session = new Session(session)
        session.cohort = Object.values(data.patients).filter(
          (patient) => patient.session_id === session.id
        )
        return session
      })

    const uuids = []
    if (data.features.uploads.on) {
      const uploads = Object.values(data.uploads).filter(
        (upload) => upload.programme_pid === pid
      )

      for (const upload of uploads) {
        for (const uuid of upload.vaccinations) {
          uuids.push(uuid)
        }
      }

      // If upload has occurred, fake issues with 3 uploaded records
      request.app.locals.reviews = getVaccinations(data, uuids.slice(0, 3))
    } else {
      Object.values(data.vaccinations)
        .filter((vaccination) => vaccination.programme_pid === pid)
        .forEach((vaccination) => uuids.push(vaccination.uuid))
    }

    const vaccinations = getVaccinations(data, uuids)

    request.app.locals.vaccinations = vaccinations
    request.app.locals.missingNhsNumber = vaccinations.filter(
      (vaccination) => vaccination.record.missingNhsNumber
    )

    // Remove any back state that have been stored
    delete request.app.locals.back

    next()
  }
}
