import express from 'express'

import { programmeController } from '../controllers/programme.js'

const router = express.Router({ strict: true })

router.all('/*', programmeController.readAll)
router.get('/', programmeController.showAll)

router.all('/:pid*', programmeController.read)
router.get('/:pid/:view?', programmeController.show)

export const programmeRoutes = router
