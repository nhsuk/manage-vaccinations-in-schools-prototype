import express from 'express'

import { sessionController } from '../controllers/session.js'

const router = express.Router({ strict: true })

router.get(
  ['/', '/:view(active|completed|planned|unplanned|closed)'],
  sessionController.list
)

router.all(['/:id', '/:id/:view'], sessionController.read)
router.get(['/:id', '/:id/:view'], sessionController.show)

router.post('/:id/offline', sessionController.downloadFile)

router.get('/:id/?:form(edit)', sessionController.edit)
router.post('/:id/?:form(edit)', sessionController.update)

router.all('/:id/?:form(new|edit)/:view', sessionController.readForm)
router.get('/:id/?:form(new|edit)/:view', sessionController.showForm)
router.post('/:id/?:form(new|edit)/:view', sessionController.updateForm)

router.post('/:id/close', sessionController.close)
router.post('/:id/default-batch', sessionController.updateDefaultBatch)
router.post('/:id/:view', sessionController.search)

export const sessionRoutes = router
