import express from 'express'

import { patientController as patient } from '../controllers/patient.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', patient.readAll, patient.list)
router.post('/', patient.filterList)

router.param('patient_uuid', patient.read)

router.get('/:patient_uuid/edit', patient.edit)
router.post('/:patient_uuid/edit', patient.update)

router.all('/:patient_uuid/edit/:view', patient.readForm)
router.get('/:patient_uuid/edit/:view', patient.showForm)
router.post('/:patient_uuid/edit/:view', patient.updateForm)

router.post('/:patient_uuid/archive', patient.archive)

router.get('/:patient_uuid{/:view}', patient.show)

export const patientRoutes = router
