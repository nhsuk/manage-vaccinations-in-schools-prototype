import express from 'express'

import { vaccineController as vaccine } from '../controllers/vaccine.js'

const router = express.Router({ strict: true })

router.get('/', vaccine.readAll, vaccine.list)

router.param('vaccine_snomed', vaccine.read)

router.get('/:vaccine_snomed/delete', vaccine.action('delete'))
router.post('/:vaccine_snomed/delete', vaccine.delete)

router.get('/:vaccine_snomed', vaccine.show)

export const vaccineRoutes = router
