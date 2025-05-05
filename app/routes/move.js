import express from 'express'

import { moveController as move } from '../controllers/move.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', move.readAll, move.list)

router.param('move_uuid', move.read)

router.get('/:move_uuid', move.show)
router.post('/:move_uuid', move.update)

export const moveRoutes = router
