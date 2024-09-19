import express from 'express'
import { sessionController } from '../controllers/session.js'

const router = express.Router({ strict: true })

router.get(['/', '/:view(active|planned|completed)'], sessionController.list)

router.get('/new', sessionController.new)
router.post('/:id/?:form(new)/check-answers', sessionController.update)

router.all('/:id*', sessionController.read)

router.get('/:id', sessionController.show)
router.get(
  '/:id/:activity(consent|triage|capture|outcome)',
  sessionController.activity
)
router.get('/:id/consents', sessionController.showConsents)
router.get('/:id/consents/:uuid/match', sessionController.showConsentMatch)
router.get('/:id/consents/:uuid/link', sessionController.showConsentLink)
router.post('/:id/consents/:uuid/link', sessionController.updateConsentLink)
router.get('/:id/consents/:uuid/add', sessionController.showConsentAdd)
router.post('/:id/consents/:uuid/add', sessionController.updateConsentAdd)

router.get('/:id/?:form(edit)', sessionController.edit)
router.post('/:id/?:form(edit)', sessionController.update)

router.all('/:id/?:form(new|edit)/:view', sessionController.readForm)
router.get('/:id/?:form(new|edit)/:view', sessionController.showForm)
router.post('/:id/?:form(new|edit)/:view', sessionController.updateForm)

export const sessionRoutes = router
