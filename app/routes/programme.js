import express from 'express'

import { programmeController as programme } from '../controllers/programme.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', programme.readAll, programme.list)

router.param('pid', programme.read)

router.all('/:pid/patients', programme.readPatients)
router.post('/:pid/patients', programme.filterPatients)

router.all('/:pid/vaccinations', programme.readVaccinations)

router.get('/:pid/:view?', programme.show)

export const programmeRoutes = router
