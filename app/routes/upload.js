import express from 'express'

import { uploadController } from '../controllers/upload.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/*', uploadController.readAll)
router.get('/', uploadController.showAll)

router.get('/new', uploadController.new)

router.all('/:id*', uploadController.read)
router.get('/:id', uploadController.show)

router.post('/:id/?:form(new|edit)/summary', uploadController.update)

router.all('/:id/?:form(new|edit)/:view', uploadController.readForm)
router.get('/:id/?:form(new|edit)/:view', uploadController.showForm)
router.post('/:id/?:form(new|edit)/:view', uploadController.updateForm)

export const uploadRoutes = router
