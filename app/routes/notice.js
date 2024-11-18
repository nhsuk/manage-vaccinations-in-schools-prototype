import express from 'express'

import { noticeController } from '../controllers/notice.js'

const router = express.Router({ strict: true })

router.all('/*', noticeController.readAll)
router.get('/', noticeController.showAll)

router.all('/:uuid*', noticeController.read)

router.get('/:uuid/archive', noticeController.action('archive'))
router.post('/:uuid/archive', noticeController.delete)

export const noticeRoutes = router
