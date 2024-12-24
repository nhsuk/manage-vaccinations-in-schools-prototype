import express from 'express'

import { homeController } from '../controllers/home.js'

const router = express.Router({ strict: true })

router.get('/', homeController.redirect)

export const homeRoutes = router
