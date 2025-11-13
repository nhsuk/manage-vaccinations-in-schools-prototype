import express from 'express'

import { schoolController as school } from '../controllers/school.js'

const router = express.Router({ strict: true })

router.get('/', school.readAll, school.list)

router.param('school_urn', school.read)

router.get('/:school_urn/sessions', school.readSessions)

router.all('/:school_urn/:view', school.readPatients)
router.post('/:school_urn/:view', school.filterPatients)

router.get('/:school_urn{/:view}', school.show)

export const schoolRoutes = router
