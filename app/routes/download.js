import express from 'express'

import { downloadController } from '../controllers/download.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', downloadController.redirect)

router.get('/new', downloadController.new)
router.post('/:id/?:form(new)/check-answers', downloadController.update)

router.all('/:id/?:form(new|edit)/:view', downloadController.readForm)
router.get('/:id/?:form(new|edit)/:view', downloadController.showForm)
router.post('/:id/?:form(new|edit)/:view', downloadController.updateForm)

export const downloadRoutes = router
