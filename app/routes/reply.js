import express from 'express'

import { replyController } from '../controllers/reply.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', replyController.redirect)

router.get('/new', replyController.new)
router.post('/:uuid/?:form(new)/check-answers', replyController.update)

router.all('/:uuid*', replyController.read)
router.get('/:uuid', replyController.show)

router.all('/:uuid/?:form(new|edit)/:view', replyController.readForm)
router.get('/:uuid/?:form(new|edit)/:view', replyController.showForm)
router.post('/:uuid/?:form(new)/:view', replyController.updateForm)

router.post('/:uuid/?:form(edit)/follow-up', replyController.followUp)
router.post('/:uuid/?:form(edit)/invalidate', replyController.invalidate)
router.post('/:uuid/?:form(edit)/withdraw', replyController.withdraw)
router.post('/:uuid/?:form(edit)/:view', replyController.update)

export const replyRoutes = router
