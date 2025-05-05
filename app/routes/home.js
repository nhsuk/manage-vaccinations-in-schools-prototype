import express from 'express'

import { homeController as home } from '../controllers/home.js'

const router = express.Router({ strict: true })

router.get('/home', home.redirect)
router.get('/dashboard', home.dashboard)

export const homeRoutes = router
