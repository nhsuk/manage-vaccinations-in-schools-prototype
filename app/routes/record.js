import express from 'express'

import { recordController as record } from '../controllers/record.js'

const router = express.Router({ strict: true })

router.get('/', record.readAll, record.list)

router.param('nhsn', record.read)

router.get('/:nhsn{/:view}', record.show)

export const recordRoutes = router
