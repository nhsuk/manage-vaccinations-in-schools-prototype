import express from 'express'

import { downloadController as download } from '../controllers/download.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', download.redirect)

router.get('/new', download.new)

router.param('download_id', download.readForm)

router.post('/:download_id/new/check-answers', download.downloadFile)

router.get('/:download_id/new/:view', download.showForm)
router.post('/:download_id/new/:view', download.updateForm)

export const downloadRoutes = router
