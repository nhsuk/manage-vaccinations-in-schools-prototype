import express from 'express'
import { sessionController } from '../controllers/session.js'

const router = express.Router({ strict: true })

router.get('/', sessionController.list)

router.get('/new', sessionController.new)
router.post('/:id/?:form(new)/check-answers', sessionController.update)

router.all('/:id*', sessionController.read)

router.get('/:id', sessionController.show)
router.get('/:id/:activity(consent)', sessionController.patients)
router.get('/:id/:activity(consent)/:nhsn', sessionController.patient)
router.get('/:id/:activity(consent)/:nhsn/log', sessionController.log)

router.get('/:id/?:form(edit)', sessionController.edit)
router.post('/:id/?:form(edit)', sessionController.update)

router.all('/:id/?:form(new|edit)/:view', sessionController.readForm)
router.get('/:id/?:form(new|edit)/:view', sessionController.showForm)
router.post('/:id/?:form(new|edit)/:view', sessionController.updateForm)

export const sessionRoutes = router
