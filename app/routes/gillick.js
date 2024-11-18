import express from 'express'

import { gillickController } from '../controllers/gillick.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/?:form(new|edit)', gillickController.read)
router.get('/?:form(new|edit)', gillickController.show)
router.post('/?:form(new|edit)', gillickController.update)

export const gillickRoutes = router
