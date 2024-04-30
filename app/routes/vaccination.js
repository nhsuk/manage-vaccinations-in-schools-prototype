import express from 'express'
import { vaccinationController } from '../controllers/vaccination.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', vaccinationController.redirect)

router.get('/new', vaccinationController.new)
router.post('/:uuid/?:form(new)/check-answers', vaccinationController.update)

router.all('/:uuid*', vaccinationController.read)

router.all('/:uuid/?:form(new|edit)/:view', vaccinationController.readForm)
router.get('/:uuid/?:form(new|edit)/:view', vaccinationController.showForm)
router.post('/:uuid/?:form(new|edit)/:view', vaccinationController.updateForm)

export const vaccinationRoutes = router
