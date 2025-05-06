import express from 'express'

import { batchController as batch } from '../controllers/batch.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/new', batch.form('new'))
router.post('/new', batch.create)

router.param('batch_id', batch.read)

router.get('/:batch_id/edit', batch.form('edit'))
router.post('/:batch_id/edit', batch.update)

router.get('/:batch_id/archive', batch.action('archive'))
router.post('/:batch_id/archive', batch.archive)

export const batchRoutes = router
