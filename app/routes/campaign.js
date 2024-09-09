import express from 'express'
import { campaignController } from '../controllers/campaign.js'

const router = express.Router({ strict: true })

router.get('/', campaignController.list)

router.get('/new', campaignController.new)
router.post('/:uid/?:form(new)/check-answers', campaignController.update)

router.all('/:uid*', campaignController.read)

router.get('/:uid', campaignController.show)
router.get('/:uid/cohorts', campaignController.cohort)
router.get('/:uid/reviews', campaignController.reviews)
router.get('/:uid/sessions', campaignController.sessions)
router.get('/:uid/uploads', campaignController.uploads)
router.get('/:uid/vaccinations', campaignController.vaccinations)

router.get('/:uid/?:form(edit)', campaignController.edit)
router.post('/:uid/?:form(edit)', campaignController.update)

router.all('/:uid/?:form(new|edit)/:view', campaignController.readForm)
router.get('/:uid/?:form(new|edit)/:view', campaignController.showForm)
router.post('/:uid/?:form(new|edit)/:view', campaignController.updateForm)

export const campaignRoutes = router
