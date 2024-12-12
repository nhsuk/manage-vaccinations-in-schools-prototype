import express from 'express'

import { inviteController } from '../controllers/invite.js'

const router = express.Router({ strict: true, mergeParams: true })

router.post('/', inviteController.update)

export const inviteRoutes = router
