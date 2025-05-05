import express from 'express'

import { vaccineController as vaccine } from '../controllers/vaccine.js'

const router = express.Router({ strict: true })

router.get('/', vaccine.readAll, vaccine.list)

router.param('snomed', vaccine.read)

router.get('/:snomed/delete', vaccine.action('delete'))
router.post('/:snomed/delete', vaccine.delete)

router.get('/:snomed', vaccine.show)

export const vaccineRoutes = router
