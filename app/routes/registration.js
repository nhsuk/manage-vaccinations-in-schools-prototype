import express from 'express'
import { registrationController } from '../controllers/registration.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/?:form(edit)', registrationController.edit)
router.post('/?:form(edit)', registrationController.update)

export const registrationRoutes = router
