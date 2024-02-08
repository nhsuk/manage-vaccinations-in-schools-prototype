import express from 'express'
import { accountController } from '../controllers/account.js'

const router = express.Router({ strict: true })

router.get('/reset-password', accountController.resetPassword)

router.get('/sign-in', accountController.signIn)
router.post('/sign-in', accountController.login)

router.get('/sign-out', accountController.logout)

router.all('/*', accountController.read)

router.get('/', accountController.edit)
router.post('/', accountController.update)

export const accountRoutes = router
