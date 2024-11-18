import express from 'express'

import { inviteController } from '../controllers/invite.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/*', inviteController.read)
router.get('/:view?', inviteController.show)
router.post('/*', inviteController.update)

export const inviteRoutes = router
