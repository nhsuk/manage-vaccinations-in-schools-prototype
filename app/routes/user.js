import express from 'express'
import { userController } from '../controllers/user.js'

const router = express.Router({ strict: true })

router.all('/*', userController.readAll)
router.get('/', userController.showAll)

router.all('/:uid*', userController.read)
router.get('/:uid/:view?', userController.show)

export const userRoutes = router
