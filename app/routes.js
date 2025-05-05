import express from 'express'
import flash from 'express-flash'

import { enumeration } from './middleware/enumeration.js'
import { environment } from './middleware/environment.js'
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
import { downloadRoutes } from './routes/download.js'
import { homeRoutes } from './routes/home.js'
import { moveRoutes } from './routes/move.js'
import { noticeRoutes } from './routes/notice.js'
import { organisationRoutes } from './routes/organisation.js'
import { parentRoutes } from './routes/parent.js'
import { patientSessionRoutes } from './routes/patient-session.js'
import { patientRoutes } from './routes/patient.js'
import { programmeRoutes } from './routes/programme.js'
import { recordRoutes } from './routes/record.js'
import { replyRoutes } from './routes/reply.js'
import { reviewRoutes } from './routes/review.js'
import { schoolRoutes } from './routes/school.js'
import { sessionRoutes } from './routes/session.js'
import { uploadRoutes } from './routes/upload.js'
import { userRoutes } from './routes/user.js'
import { vaccinationRoutes } from './routes/vaccination.js'
import { vaccineRoutes } from './routes/vaccine.js'

const router = express.Router({ strict: true })

router.use(enumeration)
router.use(environment)
router.use(internationalisation)
router.use(flash(), navigation, notification, users)
router.use(referrer)

router.use('/', homeRoutes)
router.use('/account', accountRoutes)
router.use('/cohorts', cohortRoutes)
router.use('/consents', consentRoutes)
router.use('/give-or-refuse-consent', parentRoutes)
router.use('/moves', moveRoutes)
router.use('/organisations', organisationRoutes)
router.use('/organisations/:organisation_code/clinics', clinicRoutes)
router.use('/patients', patientRoutes)
router.use('/programmes', programmeRoutes)
router.use('/programmes/:pid/cohorts', cohortRoutes)
router.use('/programmes/:pid/download', downloadRoutes)
router.use('/programmes/:pid/patients', patientSessionRoutes)
router.use('/programmes/:pid/patients/:nhsn/replies', replyRoutes)
router.use('/programmes/:pid/uploads', uploadRoutes)
router.use('/programmes/:pid/vaccinations', vaccinationRoutes)
router.use('/programmes/:pid/vaccinations/:uuid/patients', patientRoutes)
router.use('/records', recordRoutes)
router.use('/schools', schoolRoutes)
router.use('/sessions/:id/consents', consentRoutes)
router.use('/sessions', sessionRoutes)
router.use('/uploads/notices', noticeRoutes)
router.use('/uploads/reviews', reviewRoutes)
router.use('/uploads', uploadRoutes)
router.use('/uploads/:id/vaccinations', vaccinationRoutes)
router.use('/uploads/:id/patients', patientRoutes)
router.use('/users', userRoutes)
router.use('/vaccines', vaccineRoutes)
router.use('/vaccines/:snomed/batches', batchRoutes)

export default router
