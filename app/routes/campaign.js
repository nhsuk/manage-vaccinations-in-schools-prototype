import express from 'express'
import { campaignController } from '../controllers/campaign.js'

const router = express.Router({ strict: true })

router.get('/', campaignController.list)

router.all('/:uid*', campaignController.read)

router.get('/:uid', campaignController.show)

export const campaignRoutes = router
