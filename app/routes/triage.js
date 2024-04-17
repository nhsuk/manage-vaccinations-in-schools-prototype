import express from 'express'
import { triageController } from '../controllers/triage.js'

const router = express.Router({ strict: true, mergeParams: true })

router.post('/?:form(new|edit)', triageController.update)

export const triageRoutes = router
