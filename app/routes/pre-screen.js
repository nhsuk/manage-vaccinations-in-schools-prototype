import express from 'express'

import { preScreenController } from '../controllers/pre-screen.js'

const router = express.Router({ strict: true, mergeParams: true })

router.post('/', preScreenController.update)

export const preScreenRoutes = router
