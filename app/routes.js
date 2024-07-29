import express from 'express'
import flash from 'express-flash'
import { enumeration } from './middleware/enumeration.js'
import { internationalisation } from './middleware/internationalisation.js'
import { navigation } from './middleware/navigation.js'
import { notification } from './middleware/notification.js'
import { users } from './middleware/users.js'
import { accountRoutes } from './routes/account.js'
import { batchRoutes } from './routes/batch.js'
import { campaignRoutes } from './routes/campaign.js'
import { consentRoutes } from './routes/consent.js'
import { gillickRoutes } from './routes/gillick.js'
import { homeRoutes } from './routes/home.js'
import { patientRoutes } from './routes/patient.js'
import { preScreenRoutes } from './routes/pre-screen.js'
import { recordRoutes } from './routes/record.js'
import { registrationRoutes } from './routes/registration.js'
import { replyRoutes } from './routes/reply.js'
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
router.use('/campaigns', campaignRoutes)
router.use('/campaigns/:uid/uploads', uploadRoutes)
router.use('/campaigns/:uid/vaccinations', vaccinationRoutes)
router.use('/consents', consentRoutes)
router.use('/records', recordRoutes)
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
