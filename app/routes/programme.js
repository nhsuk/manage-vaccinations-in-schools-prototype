import express from 'express'
import { programmeController } from '../controllers/programme.js'

const router = express.Router({ strict: true })

router.get('/', programmeController.list)

router.all('/:pid*', programmeController.read)

router.get('/:pid', programmeController.show)
router.get('/:pid/cohorts', programmeController.cohorts)
router.get('/:pid/reviews', programmeController.reviews)
router.get('/:pid/sessions', programmeController.sessions)
router.get('/:pid/uploads', programmeController.uploads)
router.get('/:pid/vaccinations', programmeController.vaccinations)

export const programmeRoutes = router
