import express from 'express'
import { replyController } from '../controllers/reply.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', replyController.redirect)

router.all('/:uuid*', replyController.read)

router.get('/:uuid', replyController.show)

export const replyRoutes = router
