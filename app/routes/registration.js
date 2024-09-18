import express from 'express'
import { registrationController } from '../controllers/registration.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/*', registrationController.read)
router.get('/:view?', registrationController.show)
router.post('/*', registrationController.update)

export const registrationRoutes = router
