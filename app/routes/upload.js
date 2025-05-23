import express from 'express'

import { uploadController as upload } from '../controllers/upload.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', upload.readAll, upload.list)

router.get('/new', upload.new)

router.param('upload_id', upload.read)

router.post('/:upload_id/new/summary', upload.update)

router.all('/:upload_id/new/:view', upload.readForm)
router.get('/:upload_id/new/:view', upload.showForm)
router.post('/:upload_id/new/:view', upload.updateForm)

router.get(
  '/:upload_id/remove-relationships',
  upload.action('bulk remove relationships')
)
router.post('/:upload_id/remove-relationships', upload.removeRelationships)

router.get('/:upload_id{/:view}', upload.show)

export const uploadRoutes = router
