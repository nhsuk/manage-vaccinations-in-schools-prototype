import express from 'express'
import { cohortController } from '../controllers/cohort.js'

const router = express.Router({ strict: true })

router.get('/*', cohortController.readAll)
router.get('/', cohortController.showAll)

router.all('/:uid*', cohortController.read)
router.get('/:uid/:view?', cohortController.show)

export const cohortRoutes = router
