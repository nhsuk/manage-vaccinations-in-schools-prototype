import express from 'express'

import { vaccineController } from '../controllers/vaccine.js'

const router = express.Router({ strict: true })

router.all('/*', vaccineController.readAll)
router.get('/', vaccineController.showAll)

router.all('/:snomed*', vaccineController.read)
router.get('/:snomed', vaccineController.show)

router.get('/:snomed/delete', vaccineController.action('delete'))
router.post('/:snomed/delete', vaccineController.delete)

export const vaccineRoutes = router
