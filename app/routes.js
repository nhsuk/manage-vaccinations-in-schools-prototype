import express from 'express'
import flash from 'express-flash'
import { internationalisation } from './middleware/internationalisation.js'
import { notification } from './middleware/notification.js'

const router = express.Router({ strict: true })

router.use(internationalisation)
router.use(flash(), notification)

export default router
