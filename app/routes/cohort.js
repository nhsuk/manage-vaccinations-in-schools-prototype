import express from 'express'

import { cohortController as cohort } from '../controllers/cohort.js'

const router = express.Router({ strict: true })

router.get('/', cohort.readAll, cohort.list)

router.param('cohort_uid', cohort.read)

router.get('/:cohort_uid', cohort.show)

export const cohortRoutes = router
