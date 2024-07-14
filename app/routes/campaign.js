import express from 'express'
import { campaignController } from '../controllers/campaign.js'

const router = express.Router({ strict: true })

router.get('/', campaignController.list)

router.get('/new', campaignController.new)
router.post('/:uuid/?:form(new)/check-answers', campaignController.update)

router.all('/:uuid*', campaignController.read)

router.get('/:uuid', campaignController.show)
router.get('/:uuid/sessions', campaignController.sessions)

router.get('/:uuid/?:form(edit)', campaignController.edit)
router.post('/:uuid/?:form(edit)', campaignController.update)

router.all('/:uuid/?:form(new|edit)/:view', campaignController.readForm)
router.get('/:uuid/?:form(new|edit)/:view', campaignController.showForm)
router.post('/:uuid/?:form(new|edit)/:view', campaignController.updateForm)

export const campaignRoutes = router
