import { readFileSync } from 'node:fs'
import process from 'node:process'
import schools from './datasets/schools.js'
import vaccines from './datasets/vaccines.js'
const batches = JSON.parse(readFileSync('.data/batches.json'))
const cohorts = JSON.parse(readFileSync('.data/cohorts.json'))
const organisations = JSON.parse(readFileSync('.data/organisations.json'))
const patients = JSON.parse(readFileSync('.data/patients.json'))
const programmes = JSON.parse(readFileSync('.data/programmes.json'))
const records = JSON.parse(readFileSync('.data/records.json'))
const sessions = JSON.parse(readFileSync('.data/sessions.json'))
const users = JSON.parse(readFileSync('.data/users.json'))
const vaccinations = JSON.parse(readFileSync('.data/vaccinations.json'))

/**
 * Default values for user session data
 *
 * These are automatically added via the `autoStoreData` middleware. A values
 * will only be added to the session if it doesn't already exist. This may be
 * useful for testing journeys where users are returning or logging in to an
 * existing application.
 */
export default {
  batches,
  cohorts,
  features: {
    uploads: {
      on: process.env.FEATURE_UPLOADS === 'true',
      name: 'Uploads',
      description:
        'Require vaccinations to be uploaded before appearing on CHIS records.'
    }
  },
  organisation: Object.values(organisations)[0],
  organisations,
  patients,
  programmes,
  records,
  schools,
  sessions,
  uploads: {},
  users,
  vaccinations,
  vaccines,
  wizard: {}
}
