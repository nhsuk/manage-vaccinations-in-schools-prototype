import express from 'express'
import { patientController } from '../controllers/patient.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/*', patientController.read)

router.get('/', patientController.show)

router.get('/events', patientController.events)

router.all('/?:form(edit)/:view', patientController.readForm)
router.get('/?:form(edit)/:view', patientController.showForm)
router.post('/?:form(edit)/:view', patientController.updateForm)

router.get('/invite', patientController.showInvite)
router.post('/invite', patientController.updateInvite)

export const patientRoutes = router
