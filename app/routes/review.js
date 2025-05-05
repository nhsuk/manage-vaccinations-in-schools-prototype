import express from 'express'

import { reviewController as review } from '../controllers/review.js'

const router = express.Router({ strict: true })

router.get('/', review.readAll, review.list)

router.param('upload_id', review.read)

router.get('/:upload_id/:nhsn', review.show)
router.post('/:upload_id/:nhsn', review.update)

export const reviewRoutes = router
