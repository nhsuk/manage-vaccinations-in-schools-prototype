import express from 'express'

import { noticeController } from '../controllers/notice.js'

const router = express.Router({ strict: true })

router.all('/:uuid*', noticeController.read)

router.get('/:uuid/archive', noticeController.action('archive'))
router.post('/:uuid/archive', noticeController.delete)

export const noticeRoutes = router
