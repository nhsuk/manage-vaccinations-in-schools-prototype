import express from 'express'
import { defaultBatchController } from '../controllers/default-batch.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/:gtin', defaultBatchController.read)
router.get('/:gtin', defaultBatchController.show)
router.post('/:gtin', defaultBatchController.update)

export const defaultBatchRoutes = router
