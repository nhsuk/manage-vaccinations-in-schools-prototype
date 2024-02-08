import express from 'express'
import { vaccineController } from '../controllers/vaccine.js'

const router = express.Router({ strict: true })

router.get('/', vaccineController.list)

router.all('/:gtin*', vaccineController.read)

router.get('/:gtin', vaccineController.show)

router.get('/:gtin/delete', vaccineController.action('delete'))
router.post('/:gtin/delete', vaccineController.delete)

export const vaccineRoutes = router
