import express from 'express'

import { moveController } from '../controllers/move.js'

const router = express.Router({ strict: true, mergeParams: true })

router.all('/*', moveController.readAll)
router.get('/', moveController.showAll)

router.all('/:uuid*', moveController.read)
router.get('/:uuid/:view?', moveController.show)

router.post('/*', moveController.update)

export const moveRoutes = router
