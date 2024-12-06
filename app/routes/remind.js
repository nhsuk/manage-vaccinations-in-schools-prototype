import express from 'express'

import { remindController } from '../controllers/remind.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/*', remindController.read)
router.post('/*', remindController.update)

export const remindRoutes = router
