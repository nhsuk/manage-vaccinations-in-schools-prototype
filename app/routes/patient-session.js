import express from 'express'

import { patientSessionController } from '../controllers/patient-session.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/:nhsn*', patientSessionController.read)
router.get(['/:nhsn', '/:nhsn/?:view'], patientSessionController.show)

router.all('/:nhsn/?:form(new|edit)/:view', patientSessionController.readForm)
router.get('/:nhsn/?:form(new|edit)/:view', patientSessionController.showForm)
router.post('/:nhsn/?:form(new|edit)/gillick', patientSessionController.gillick)
router.post(
  '/:nhsn/?:form(new|edit)/pre-screen',
  patientSessionController.preScreen
)
router.post(
  '/:nhsn/?:form(new|edit)/registration',
  patientSessionController.registration
)
router.post('/:nhsn/?:form(new|edit)/triage', patientSessionController.triage)

export const patientSessionRoutes = router
