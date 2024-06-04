import express from 'express'
import { consentController } from '../controllers/consent.js'

const router = express.Router({ strict: true })

router.use('/:id*', consentController.read)

router.get('/:id/new', consentController.new)
router.post('/:id/:uuid/?:form(new)/check-answers', consentController.update)

router.all('/:id/:uuid/?:form(new|edit)/:view', consentController.readForm)
router.get('/:id/:uuid/?:form(new|edit)/:view', consentController.showForm)
router.post('/:id/:uuid/?:form(new|edit)/:view', consentController.updateForm)

router.get('/:id/:view?', consentController.show)

export const consentRoutes = router
