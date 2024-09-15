import express from 'express'
import flash from 'express-flash'
import { enumeration } from './middleware/enumeration.js'
import { internationalisation } from './middleware/internationalisation.js'
import { navigation } from './middleware/navigation.js'
import { notification } from './middleware/notification.js'
import { users } from './middleware/users.js'
import { accountRoutes } from './routes/account.js'
import { batchRoutes } from './routes/batch.js'
import { cohortRoutes } from './routes/cohort.js'
import { consentRoutes } from './routes/consent.js'
import { downloadRoutes } from './routes/download.js'
import { gillickRoutes } from './routes/gillick.js'
import { homeRoutes } from './routes/home.js'
import { patientRoutes } from './routes/patient.js'
import { preScreenRoutes } from './routes/pre-screen.js'
import { programmeRoutes } from './routes/programme.js'
import { recordRoutes } from './routes/record.js'
import { registrationRoutes } from './routes/registration.js'
import { replyRoutes } from './routes/reply.js'
import { schoolRoutes } from './routes/school.js'
import { sessionRoutes } from './routes/session.js'
import { triageRoutes } from './routes/triage.js'
import { uploadRoutes } from './routes/upload.js'
import { userRoutes } from './routes/user.js'
import { vaccinationRoutes } from './routes/vaccination.js'
import { vaccineRoutes } from './routes/vaccine.js'

const router = express.Router({ strict: true })

router.use(enumeration)
router.use(internationalisation)
router.use(flash(), navigation, notification, users)

router.use('/home', homeRoutes)
router.use('/account', accountRoutes)
router.use('/cohorts', cohortRoutes)
router.use('/cohorts/:uid/:nhsn', patientRoutes)
router.use('/consents', consentRoutes)
router.use('/programmes', programmeRoutes)
router.use('/programmes/:pid/cohorts', cohortRoutes)
router.use('/programmes/:pid/download', downloadRoutes)
router.use('/programmes/:pid/uploads', uploadRoutes)
router.use('/programmes/:pid/uploads/:id/vaccinations', vaccinationRoutes)
router.use('/programmes/:pid/vaccinations', vaccinationRoutes)
router.use('/programmes/:pid/vaccinations/:uuid/patient/:nhsn', patientRoutes)
router.use('/records', recordRoutes)
router.use('/schools', schoolRoutes)
router.use('/sessions', sessionRoutes)
router.use('/sessions/:id/:nhsn', patientRoutes)
router.use('/sessions/:id/:nhsn/gillick', gillickRoutes)
router.use('/sessions/:id/:nhsn/pre-screen', preScreenRoutes)
router.use('/sessions/:id/:nhsn/registration', registrationRoutes)
router.use('/sessions/:id/:nhsn/replies', replyRoutes)
router.use('/sessions/:id/:nhsn/triage', triageRoutes)
router.use('/users', userRoutes)
router.use('/vaccines', vaccineRoutes)
router.use('/vaccines/:gtin', batchRoutes)

export default router
