import { readFileSync } from 'fs'
import vaccines from './datasets/vaccines.js'
const batches = JSON.parse(readFileSync('.data/batches.json'))
const records = JSON.parse(readFileSync('.data/records.json'))
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
  // Set feature flags using the `features` key
  features: {
    demo: {
      on: false,
      name: 'Demonstration',
      description: 'Show message about feature flags on the home page.'
    }
  },
  records,
  users,
  vaccines
}
