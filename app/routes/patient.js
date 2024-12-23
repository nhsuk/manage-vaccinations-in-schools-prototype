import express from 'express'

import { patientController } from '../controllers/patient.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/*', patientController.readAll)
router.get('/', patientController.showAll)
router.post('/', patientController.updateAll)

router.all('/:nhsn*', patientController.read)
router.get(['/:nhsn', '/:nhsn/?:view(events)'], patientController.show)

router.get('/:nhsn/?:form(edit)', patientController.edit)
router.post('/:nhsn/?:form(edit)', patientController.update)

router.all('/:nhsn/?:form(new|edit)/:view', patientController.readForm)
router.get('/:nhsn/?:form(new|edit)/:view', patientController.showForm)
router.post('/:nhsn/?:form(new|edit)/:view', patientController.updateForm)

router.post('/:nhsn/reject', patientController.reject)

export const patientRoutes = router
