import express from 'express'
import { gillickController } from '../controllers/gillick.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', gillickController.redirect)

router.get('/new', gillickController.new)
router.post('/?:form(new)/check-answers', gillickController.update)

router.post('/?:form(edit)/:view', gillickController.update)

router.all('/?:form(new|edit)/:view', gillickController.readForm)
router.get('/?:form(new|edit)/:view', gillickController.showForm)
router.post('/?:form(new|edit)/:view', gillickController.updateForm)

export const gillickRoutes = router
