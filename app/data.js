import vaccines from './datasets/vaccines.js'
import batches from '../.data/batches.json' with { type: 'json' }
import clinics from '../.data/clinics.json' with { type: 'json' }
import cohorts from '../.data/cohorts.json' with { type: 'json' }
import moves from '../.data/moves.json' with { type: 'json' }
import notices from '../.data/notices.json' with { type: 'json' }
import organisations from '../.data/organisations.json' with { type: 'json' }
import patients from '../.data/patients.json' with { type: 'json' }
import patientSessions from '../.data/patient-sessions.json' with { type: 'json' }
import programmes from '../.data/programmes.json' with { type: 'json' }
import replies from '../.data/replies.json' with { type: 'json' }
import records from '../.data/records.json' with { type: 'json' }
import schools from '../.data/schools.json' with { type: 'json' }
import sessions from '../.data/sessions.json' with { type: 'json' }
import uploads from '../.data/uploads.json' with { type: 'json' }
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
  features: {},
  moves,
  notices,
  organisation,
  organisations,
  patients,
  patientSessions,
  programmes,
  records,
  replies,
  schools,
  sessions,
  uploads,
  users,
  vaccinations,
  vaccines,
  wizard: {}
}
