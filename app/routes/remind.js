import express from 'express'
import { remindController } from '../controllers/remind.js'

const router = express.Router({ strict: true, mergeParams: true })

router.post('/*', remindController.update)

export const remindRoutes = router
