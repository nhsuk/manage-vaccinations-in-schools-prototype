import express from 'express'
import { manualController } from '../controllers/manual.js'

const router = express.Router({ strict: true })

router.all(['/', '/:view?'], manualController.read)
router.get(['/', '/:view?'], manualController.show)

export const manualRoutes = router
