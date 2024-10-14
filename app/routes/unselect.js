import express from 'express'
import { unselectController } from '../controllers/unselect.js'

const router = express.Router({ strict: true, mergeParams: true })

router.post('/', unselectController.update)

export const unselectRoutes = router
