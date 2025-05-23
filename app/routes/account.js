import express from 'express'

import { accountController as account } from '../controllers/account.js'

const router = express.Router({ strict: true })

router.post('/cis2', account.login)

router.post('/change-role', account.changeRole)

router.get('/sign-out', account.logout)

export const accountRoutes = router
