import express from 'express'
import { importController } from '../controllers/import.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', importController.redirect)

router.get('/new', importController.new)

router.all('/:id*', importController.read)
router.get('/:id', importController.show)

router.all('/:id/?:form(new|edit)/:view', importController.readForm)
router.get('/:id/?:form(new|edit)/:view', importController.showForm)
router.post('/:id/?:form(new|edit)/:view', importController.updateForm)

router.use('/:id/review/:nhsn', importController.readReview)
router.get('/:id/review/:nhsn', importController.showReview)
router.post('/:id/review/:nhsn', importController.updateReview)

export const importRoutes = router
