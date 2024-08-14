import express from 'express'
import { vaccinationController } from '../controllers/vaccination.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', vaccinationController.redirect)

router.get('/new', vaccinationController.new)
router.post('/:uuid/?:form(new)/check-answers', vaccinationController.update)

router.all('/:uuid*', vaccinationController.read)

router.get('/:uuid', vaccinationController.show)

router.get('/:uuid/?:form(edit)', vaccinationController.edit)
router.post('/:uuid/?:form(edit)', vaccinationController.update)

router.all('/:uuid/?:form(new|edit)/:view', vaccinationController.readForm)
router.get('/:uuid/?:form(new|edit)/:view', vaccinationController.showForm)
router.post('/:uuid/?:form(new|edit)/:view', vaccinationController.updateForm)

router.use('/:uuid/review', vaccinationController.readReview)
router.get('/:uuid/review', vaccinationController.showReview)
router.post('/:uuid/review', vaccinationController.updateReview)

export const vaccinationRoutes = router
