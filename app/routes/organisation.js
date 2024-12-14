import express from 'express'

import { organisationController } from '../controllers/organisation.js'

const router = express.Router({ strict: true })

router.all('/:code', organisationController.redirect)

router.all(['/:code/:view?', '/:code/:form/:view'], organisationController.read)
router.get('/:code/:view?', organisationController.show)

router.all('/:code/?:form(edit)/:view', organisationController.readForm)
router.get('/:code/?:form(edit)/:view', organisationController.showForm)
router.post('/:code/?:form(edit)/:view', organisationController.updateForm)

export const organisationRoutes = router
