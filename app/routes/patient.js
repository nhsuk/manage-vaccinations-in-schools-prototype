import express from 'express'
import { patientController } from '../controllers/patient.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/:nhsn*', patientController.read)
router.get('/:nhsn/:view?', patientController.show)

router.all('/:nhsn/?:form(edit)/:view', patientController.readForm)
router.get('/:nhsn/?:form(edit)/:view', patientController.showForm)
router.post('/:nhsn/?:form(edit)/:view', patientController.updateForm)

export const patientRoutes = router
