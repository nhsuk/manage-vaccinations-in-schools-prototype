import express from 'express'

import { consentController } from '../controllers/consent.js'

const router = express.Router({ strict: true })

router.all('/*', consentController.readAll)
router.get('/', consentController.showAll)

router.get('/:uuid/match', consentController.showMatch)

router.all('/:uuid/link', consentController.readLink)
router.get('/:uuid/link', consentController.showLink)
router.post('/:uuid/link', consentController.updateLink)

router.all('/:uuid/add', consentController.readAdd)
router.get('/:uuid/add', consentController.showAdd)
router.post('/:uuid/add', consentController.updateAdd)

export const consentRoutes = router
