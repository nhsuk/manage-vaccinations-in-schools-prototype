import express from 'express'

import { parentController } from '../controllers/parent.js'

const router = express.Router({ strict: true })

router.use('/:id*', parentController.read)
router.get(['/:id', '/:id/'], parentController.redirect)

router.get('/:id/new', parentController.new)

router.get('/:id/:view?', parentController.show)

router.all('/:id/:uuid/?:form(new)/check-answers', parentController.readForm)
router.post('/:id/:uuid/?:form(new)/check-answers', parentController.update)

router.all('/:id/:uuid/?:form(new|edit)/:view', parentController.readForm)
router.get('/:id/:uuid/?:form(new|edit)/:view', parentController.showForm)
router.post('/:id/:uuid/?:form(new|edit)/:view', parentController.updateForm)

export const parentRoutes = router
