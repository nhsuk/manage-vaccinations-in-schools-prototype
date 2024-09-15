import { Cohort } from '../models/cohort.js'
import { Programme } from '../models/programme.js'
import { Record } from '../models/record.js'
import { School } from '../models/school.js'
import { Session } from '../models/session.js'
import { Upload } from '../models/upload.js'
import { Vaccination } from '../models/vaccination.js'

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
      programme.records = records.map((nhsn) => new Record(data.records[nhsn]))

      // Schools in programme
      const urns = [...new Set(programme.records.map((record) => record.urn))]
      programme.schools = Object.values(data.schools)
        .filter((school) => urns.includes(school.urn))
        .map((school) => {
          school = new School(school)

          // Add patients to school
          school.patients = Object.values(data.patients).filter(
            (patient) => patient.record.urn === school.urn
          )

          return school
        })

      // Sessions in programme
      programme.sessions = Object.values(data.sessions)
        .filter((session) => session.programmes.includes(programme.pid))
        .map((session) => {
          session = new Session(session)

          // Add patients to session
          session.patients = Object.values(data.patients).filter(
            (patient) => patient.session_id === session.id
          )

          return session
        })

      // Recorded vaccinations in programme
      programme.vaccinations = Object.values(data.vaccinations)
        .filter((vaccination) => vaccination.programme_pid === programme.pid)
        .filter((vaccination) => !vaccination._pending)
        .map((vaccination) => {
          vaccination = new Vaccination(vaccination)

          // Add record to vaccination
          vaccination.record = new Record(
            data.patients[vaccination.patient_uuid].record
          )

          return vaccination
        })

      // Vaccination records uploaded to programme
      if (data.features.uploads.on) {
        programme.uploads = Object.values(data.uploads)
          .filter((upload) => upload.programme_pid === programme.pid)
          .map((upload) => new Upload(upload))

        programme.reviews = programme.vaccinations.slice(0, 3)
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

    response.locals.programme = programme

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`programme/${view}`)
  }
}
