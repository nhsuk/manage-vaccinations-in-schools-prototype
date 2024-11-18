import express from 'express'

import { triageController } from '../controllers/triage.js'

const router = express.Router({ strict: true, mergeParams: true })

router.post('/?:form(new|edit)', triageController.update)

router.all('/?:form(new|edit)/:view', triageController.readForm)
router.get('/?:form(new|edit)/:view', triageController.showForm)
router.post('/?:form(new|edit)/:view', triageController.update)

export const triageRoutes = router
