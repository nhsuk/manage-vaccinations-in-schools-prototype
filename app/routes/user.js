import express from 'express'
import { userController } from '../controllers/user.js'

const router = express.Router({ strict: true })

router.get('/', userController.list)

router.all('/:uid*', userController.read)

router.get('/:uid', userController.show)

export const userRoutes = router
