import express from 'express'
import { batchController } from '../controllers/batch.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/new', batchController.new)
router.post('/new', batchController.create)

router.all('/:id*', batchController.read)

router.get('/:id/edit', batchController.edit)
router.post('/:id/edit', batchController.update)

export const batchRoutes = router
