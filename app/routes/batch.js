import express from 'express'

import { batchController } from '../controllers/batch.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/:form(new)', batchController.show)
router.post('/:form(new)', batchController.create)

router.all('/:id*', batchController.read)

router.get('/:id/:form(edit)', batchController.show)
router.post('/:id/:form(edit)', batchController.update)

router.get('/:id/archive', batchController.action('archive'))
router.post('/:id/archive', batchController.archive)

export const batchRoutes = router
