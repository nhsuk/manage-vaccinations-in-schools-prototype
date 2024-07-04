import express from 'express'
import { accountController } from '../controllers/account.js'

const router = express.Router({ strict: true })

router.post(['/sign-in', '/cis2'], accountController.login)
router.post(['/change-role'], accountController.changeRole)

router.get('/sign-out', accountController.logout)

export const accountRoutes = router
