import express from 'express'

import { noticeController as notice } from '../controllers/notice.js'

const router = express.Router({ strict: true })

router.get('/', notice.readAll, notice.list)

router.param('notice_uuid', notice.read)

router.get('/:notice_uuid/archive', notice.action('archive'))
router.post('/:notice_uuid/archive', notice.delete)

export const noticeRoutes = router
