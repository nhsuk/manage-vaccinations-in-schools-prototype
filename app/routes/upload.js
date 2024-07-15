import express from 'express'
import { uploadController } from '../controllers/upload.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', uploadController.redirect)

router.get('/new', uploadController.new)
router.post('/:id/?:form(new)/check-answers', uploadController.update)

router.all('/:id*', uploadController.read)

router.get('/:id', uploadController.show)

router.post('/:id/?:form(edit)', uploadController.update)

router.all('/:id/?:form(new|edit)/:view', uploadController.readForm)
router.get('/:id/?:form(new|edit)/:view', uploadController.showForm)
router.post('/:id/?:form(new|edit)/:view', uploadController.updateForm)

export const uploadRoutes = router
