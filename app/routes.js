import express from 'express'
import flash from 'express-flash'

import { enumeration } from './middleware/enumeration.js'
import { internationalisation } from './middleware/internationalisation.js'
import { navigation } from './middleware/navigation.js'
import { notification } from './middleware/notification.js'
import { referrer } from './middleware/referrer.js'
import { users } from './middleware/users.js'
import { accountRoutes } from './routes/account.js'
import { batchRoutes } from './routes/batch.js'
import { clinicRoutes } from './routes/clinic.js'
import { cohortRoutes } from './routes/cohort.js'
import { consentRoutes } from './routes/consent.js'
import { defaultBatchRoutes } from './routes/default-batch.js'
import { downloadRoutes } from './routes/download.js'
import { homeRoutes } from './routes/home.js'
import { importRoutes } from './routes/import.js'
import { moveRoutes } from './routes/move.js'
import { noticeRoutes } from './routes/notice.js'
import { organisationRoutes } from './routes/organisation.js'
import { patientSessionRoutes } from './routes/patient-session.js'
import { patientRoutes } from './routes/patient.js'
import { programmeRoutes } from './routes/programme.js'
import { recordRoutes } from './routes/record.js'
import { replyRoutes } from './routes/reply.js'
import { schoolRoutes } from './routes/school.js'
import { sessionRoutes } from './routes/session.js'
import { unselectRoutes } from './routes/unselect.js'
import { userRoutes } from './routes/user.js'
import { vaccinationRoutes } from './routes/vaccination.js'
import { vaccineRoutes } from './routes/vaccine.js'

const router = express.Router({ strict: true })

router.use(enumeration)
router.use(internationalisation)
router.use(flash(), navigation, notification, users)
router.use(referrer)

router.use('/home', homeRoutes)
router.use('/account', accountRoutes)
router.use('/cohorts', cohortRoutes)
router.use('/consents', consentRoutes)
router.use('/moves', moveRoutes)
router.use('/notices', noticeRoutes)
router.use('/organisations', organisationRoutes)
router.use('/organisations/:code/clinics', clinicRoutes)
router.use('/patients', patientRoutes)
router.use('/patients/:nhsn/unselect', unselectRoutes)
router.use('/programmes', programmeRoutes)
router.use('/programmes/:pid/cohorts', cohortRoutes)
router.use('/programmes/:pid/download', downloadRoutes)
router.use('/programmes/:pid/imports', importRoutes)
router.use('/programmes/:pid/imports/:id/vaccinations', vaccinationRoutes)
router.use('/programmes/:pid/imports/:id/patients', patientRoutes)
router.use('/programmes/:pid/vaccinations', vaccinationRoutes)
router.use('/programmes/:pid/vaccinations/:uuid/patients', patientRoutes)
router.use('/records', recordRoutes)
router.use('/schools', schoolRoutes)
router.use('/sessions', sessionRoutes)
router.use('/sessions/:id/default-batch', defaultBatchRoutes)
router.use('/sessions/:id', patientSessionRoutes)
router.use('/sessions/:id/:nhsn/replies', replyRoutes)
router.use('/users', userRoutes)
router.use('/vaccines', vaccineRoutes)
router.use('/vaccines/:gtin', batchRoutes)

export default router
