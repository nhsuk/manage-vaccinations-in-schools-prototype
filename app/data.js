import vaccines from './datasets/vaccines.js'
import batches from '../.data/batches.json' with { type: 'json' }
import clinics from '../.data/clinics.json' with { type: 'json' }
import cohorts from '../.data/cohorts.json' with { type: 'json' }
import consents from '../.data/consents.json' with { type: 'json' }
import imports from '../.data/imports.json' with { type: 'json' }
import moves from '../.data/moves.json' with { type: 'json' }
import notices from '../.data/notices.json' with { type: 'json' }
import organisations from '../.data/organisations.json' with { type: 'json' }
import patients from '../.data/patients.json' with { type: 'json' }
import programmes from '../.data/programmes.json' with { type: 'json' }
import records from '../.data/records.json' with { type: 'json' }
import schools from '../.data/schools.json' with { type: 'json' }
import sessions from '../.data/sessions.json' with { type: 'json' }
import users from '../.data/users.json' with { type: 'json' }
import vaccinations from '../.data/vaccinations.json' with { type: 'json' }

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
  clinics,
  cohorts,
  consents,
  features: {},
  imports,
  moves,
  notices,
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
