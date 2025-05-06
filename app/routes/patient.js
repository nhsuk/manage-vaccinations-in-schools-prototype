import express from 'express'

import { patientController as patient } from '../controllers/patient.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', patient.readAll, patient.list)
router.post('/', patient.filterList)

router.param('nhsn', patient.read)

router.get('/:nhsn/edit', patient.edit)
router.post('/:nhsn/edit', patient.update)

router.all('/:nhsn/edit/:view', patient.readForm)
router.get('/:nhsn/edit/:view', patient.showForm)
router.post('/:nhsn/edit/:view', patient.updateForm)

router.post('/:nhsn/unselect', patient.unselect)

router.get('/:nhsn{/:view}', patient.show)

export const patientRoutes = router
