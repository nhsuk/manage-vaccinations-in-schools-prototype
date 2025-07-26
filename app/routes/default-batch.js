import express from 'express'

import { defaultBatchController as defaultBatch } from '../controllers/default-batch.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/:vaccine_snomed', defaultBatch.read)
router.get('/:vaccine_snomed', defaultBatch.show)
router.post('/:vaccine_snomed', defaultBatch.update)

export const defaultBatchRoutes = router
