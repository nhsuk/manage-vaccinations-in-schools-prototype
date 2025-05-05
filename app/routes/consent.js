import express from 'express'

import { consentController as consent } from '../controllers/consent.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', consent.readAll, consent.list)

router.param('consent_uuid', consent.read)

router.all('/:consent_uuid/match', consent.readMatches)
router.post('/:consent_uuid/match', consent.filterMatches)

router.post('/:consent_uuid/invalidate', consent.invalidate)
router.post('/:consent_uuid/link', consent.link)
router.post('/:consent_uuid/add', consent.add)

router.get('/:consent_uuid/:view?', consent.show)

export const consentRoutes = router
