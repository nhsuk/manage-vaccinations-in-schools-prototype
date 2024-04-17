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
import { gillickRoutes } from './routes/gillick.js'
import { patientRoutes } from './routes/patient.js'
import { recordRoutes } from './routes/record.js'
import { replyRoutes } from './routes/reply.js'
import { sessionRoutes } from './routes/session.js'
import { triageRoutes } from './routes/triage.js'
import { userRoutes } from './routes/user.js'
import { vaccineRoutes } from './routes/vaccine.js'

const router = express.Router({ strict: true })

router.use(enumeration)
router.use(internationalisation)
router.use(flash(), navigation, notification, users)

router.use('/account', accountRoutes)
router.use('/campaigns', campaignRoutes)
router.use('/records', recordRoutes)
router.use('/sessions', sessionRoutes)
router.use('/sessions/:id/:nhsn', patientRoutes)
router.use('/sessions/:id/:nhsn/gillick', gillickRoutes)
router.use('/sessions/:id/:nhsn/replies', replyRoutes)
router.use('/sessions/:id/:nhsn/triage', triageRoutes)
router.use('/users', userRoutes)
router.use('/vaccines', vaccineRoutes)
router.use('/vaccines/:gtin', batchRoutes)

export default router
