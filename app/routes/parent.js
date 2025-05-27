import express from 'express'

import { parentController as parent } from '../controllers/parent.js'

const router = express.Router({ strict: true })

router.param('session_id', parent.read)

router.get(['/:session_id', '/:session_id/'], parent.redirect)

router.get('/:session_id/new', parent.new)

router.all('/:session_id/:consent_uuid/new/:view', parent.readForm)
router.get('/:session_id/:consent_uuid/new/:view', parent.showForm)
router.post('/:session_id/:consent_uuid/new/check-answers', parent.update)
router.post('/:session_id/:consent_uuid/new/:view', parent.updateForm)

router.get('/:session_id{/:view}', parent.show)

export const parentRoutes = router
