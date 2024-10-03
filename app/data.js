import { readFileSync } from 'node:fs'
import process from 'node:process'
import vaccines from './datasets/vaccines.js'
const batches = JSON.parse(readFileSync('.data/batches.json'))
const cohorts = JSON.parse(readFileSync('.data/cohorts.json'))
const imports = JSON.parse(readFileSync('.data/imports.json'))
const organisations = JSON.parse(readFileSync('.data/organisations.json'))
const patients = JSON.parse(readFileSync('.data/patients.json'))
const programmes = JSON.parse(readFileSync('.data/programmes.json'))
const records = JSON.parse(readFileSync('.data/records.json'))
const schools = JSON.parse(readFileSync('.data/schools.json'))
const sessions = JSON.parse(readFileSync('.data/sessions.json'))
const users = JSON.parse(readFileSync('.data/users.json'))
const vaccinations = JSON.parse(readFileSync('.data/vaccinations.json'))

// Use Coventry and Warwickshire as organisation
const organisation = organisations.RYG

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
  features: {},
  imports,
  organisation,
  organisations,
  patients,
  programmes,
  records,
  schools,
  sessions,
  users,
  vaccinations,
  vaccines,
  wizard: {}
}
