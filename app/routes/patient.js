import express from 'express'
import { patientController } from '../controllers/patient.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/*', patientController.read)

router.get('/', patientController.show)

export const patientRoutes = router
