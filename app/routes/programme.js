import express from 'express'

import { programmeController as programme } from '../controllers/programme.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', programme.readAll, programme.list)

router.param('programme_id', programme.read)

router.get('/:programme_id{/:view}', programme.show)

export const programmeRoutes = router
