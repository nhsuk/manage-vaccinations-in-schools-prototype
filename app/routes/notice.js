import express from 'express'
import { noticeController } from '../controllers/notice.js'

const router = express.Router({ strict: true })

router.all('/*', noticeController.readAll)
router.get('/', noticeController.showAll)

export const noticeRoutes = router
