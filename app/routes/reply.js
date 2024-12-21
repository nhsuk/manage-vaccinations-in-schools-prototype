import express from 'express'

import { replyController } from '../controllers/reply.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', replyController.redirect)

router.get('/new', replyController.new)
router.post('/:uuid/new/check-answers', replyController.update)

router.all('/:uuid*', replyController.read)
router.get('/:uuid', replyController.show)

router.all('/:uuid/?:form(new|edit)/:view', replyController.readForm)
router.get('/:uuid/?:form(new|edit)/:view', replyController.showForm)
router.post('/:uuid/new/:view', replyController.updateForm)

router.post('/:uuid/edit/follow-up', replyController.followUp)
router.post('/:uuid/edit/invalidate', replyController.invalidate)
router.post('/:uuid/edit/withdraw', replyController.withdraw)
router.post('/:uuid/edit/:view', replyController.update)

export const replyRoutes = router
