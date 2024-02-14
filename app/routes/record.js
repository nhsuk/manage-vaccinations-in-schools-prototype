import express from 'express'
import { recordController } from '../controllers/record.js'

const router = express.Router({ strict: true })

router.get('/', recordController.list)

router.all('/:nhsn*', recordController.read)

router.get('/:nhsn', recordController.show)

export const recordRoutes = router
