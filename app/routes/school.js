import express from 'express'

import { schoolController } from '../controllers/school.js'

const router = express.Router({ strict: true })

router.all('/*', schoolController.readAll)
router.get('/', schoolController.showAll)

router.all('/:urn*', schoolController.read)
router.get('/:urn/:view?', schoolController.show)

export const schoolRoutes = router
