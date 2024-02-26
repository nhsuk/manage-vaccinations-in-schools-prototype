import _ from 'lodash'
import { readFileSync } from 'fs'
import registrars from './datasets/professional-bodies.js'
import schools from './datasets/schools.js'
import vaccines from './datasets/vaccines.js'
const batches = JSON.parse(readFileSync('.data/batches.json'))
const campaigns = JSON.parse(readFileSync('.data/campaigns.json'))
const patients = JSON.parse(readFileSync('.data/patients.json'))
const records = JSON.parse(readFileSync('.data/records.json'))
const sessions = JSON.parse(readFileSync('.data/sessions.json'))
const users = JSON.parse(readFileSync('.data/users.json'))

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
  campaigns,
  // Set feature flags using the `features` key
  features: {
    demo: {
      on: false,
      name: 'Demonstration',
      description: 'Show message about feature flags on the home page.'
    }
  },
  patients,
  records,
  registrars,
  schools,
  sessions,
  users,
  vaccines: _.keyBy(vaccines, 'gtin')
}
