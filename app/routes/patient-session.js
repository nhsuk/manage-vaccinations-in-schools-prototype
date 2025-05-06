import express from 'express'

import { patientSessionController as patientSession } from '../controllers/patient-session.js'

const router = express.Router({ strict: true, mergeParams: true })

router.param('nhsn', patientSession.read)

router.all('/:nhsn/new/:view', patientSession.readForm)
router.get('/:nhsn/new/vaccination', patientSession.vaccination)
router.get('/:nhsn/new/:view', patientSession.showForm('new'))

router.post('/:nhsn/new/gillick', patientSession.gillick('new'))
router.post('/:nhsn/new/pre-screen', patientSession.preScreen)
router.post('/:nhsn/new/invite', patientSession.invite)
router.post('/:nhsn/new/remind', patientSession.remind)
router.post('/:nhsn/new/triage', patientSession.triage)

router.all('/:nhsn/edit/:view', patientSession.readForm)
router.get('/:nhsn/edit/:view', patientSession.showForm('edit'))

router.post('/:nhsn/edit/gillick', patientSession.gillick('edit'))
router.post('/:nhsn/edit/registration', patientSession.register)
router.post('/:nhsn/edit/triage', patientSession.triage)

router.get('/:nhsn/:view?', patientSession.show)

export const patientSessionRoutes = router
