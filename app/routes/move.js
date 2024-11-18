import express from 'express'

import { moveController } from '../controllers/move.js'

const router = express.Router({ strict: true, mergeParams: true })

router.post('/*', moveController.update)

export const moveRoutes = router
