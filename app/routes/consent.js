import express from 'express'

import { consentController } from '../controllers/consent.js'

const router = express.Router({ strict: true })

router.all('/*', consentController.readAll)
router.get('/', consentController.showAll)

router.all('/:uuid*', consentController.read)
router.get('/:uuid/match', consentController.match)
router.get('/:uuid/:view', consentController.show)

router.post('/:uuid/invalidate', consentController.invalidate)
router.post('/:uuid/link', consentController.link)
router.post('/:uuid/add', consentController.add)

export const consentRoutes = router
