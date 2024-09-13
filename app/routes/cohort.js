import express from 'express'
import { cohortController } from '../controllers/cohort.js'

const router = express.Router({ strict: true })

router.get('/', cohortController.list)

router.all('/:uid*', cohortController.read)

router.get('/:uid', cohortController.show)

export const cohortRoutes = router
