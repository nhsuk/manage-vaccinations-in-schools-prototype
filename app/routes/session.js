import express from 'express'

import { sessionController } from '../controllers/session.js'

const router = express.Router({ strict: true })

router.get(
  ['/', '/:view(active|completed|planned|unplanned|closed)'],
  sessionController.list
)

router.get('/new', sessionController.new)
router.post('/:id/?:form(new)/check-answers', sessionController.update)

router.all('/:id*', sessionController.read)

router.get('/:id', sessionController.show)
router.get(
  '/:id/:activity(consent|triage|capture|outcome)',
  sessionController.activity
)
router.all('/:id/offline', sessionController.readOffline)
router.get('/:id/offline', sessionController.showOffline)
router.post('/:id/offline', sessionController.updateOffline)

router.all('/:id/close', sessionController.readClose)
router.get('/:id/close', sessionController.showClose)
router.post('/:id/close', sessionController.updateClose)

router.get('/:id/?:form(edit)', sessionController.edit)
router.post('/:id/?:form(edit)', sessionController.update)

router.all('/:id/?:form(new|edit)/:view', sessionController.readForm)
router.get('/:id/?:form(new|edit)/:view', sessionController.showForm)
router.post('/:id/?:form(new|edit)/:view', sessionController.updateForm)

export const sessionRoutes = router
