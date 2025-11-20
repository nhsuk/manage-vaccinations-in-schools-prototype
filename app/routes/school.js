import express from 'express'

import { schoolController as school } from '../controllers/school.js'

const router = express.Router({ strict: true })

router.get('/', school.readAll, school.list)
router.post('/', school.filterList)

router.param('school_urn', school.read)

router.all('/:school_urn', school.readPatients)
router.post('/:school_urn', school.filterPatients)

router.get('/:school_urn/sessions', school.readSessions)

router.get('/:school_urn{/:view}', school.show)

export const schoolRoutes = router
