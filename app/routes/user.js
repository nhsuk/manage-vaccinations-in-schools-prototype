import express from 'express'

import { userController as user } from '../controllers/user.js'

const router = express.Router({ strict: true })

router.get('/', user.readAll, user.list)

router.param('user_uid', user.read)

router.get('/:user_uid{/:view}', user.show)

export const userRoutes = router
