import express from 'express'

import { homeController } from '../controllers/home.js'

const router = express.Router({ strict: true })

router.get('/home', homeController.redirect)
router.get('/dashboard', homeController.dashboard)

export const homeRoutes = router
