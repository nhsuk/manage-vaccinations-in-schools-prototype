import express from 'express'

import { recordController } from '../controllers/record.js'

const router = express.Router({ strict: true })

router.all('/*', recordController.readAll)
router.get('/', recordController.showAll)

router.all('/:nhsn*', recordController.read)
router.get('/:nhsn/:view?', recordController.show)

export const recordRoutes = router
