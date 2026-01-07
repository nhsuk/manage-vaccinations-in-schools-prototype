import express from 'express'

import { schoolController as school } from '../controllers/school.js'

const router = express.Router({ strict: true })

router.get('/', school.readAll, school.list)
router.post('/', school.filterList)

router.param('school_urn', school.read)

router.get('/:school_urn/edit', school.edit)
router.post('/:school_urn/edit', school.update('edit'))

router.all('/:school_urn/edit/:view', school.readForm('edit'))
router.get('/:school_urn/edit/:view', school.showForm)
router.post('/:school_urn/edit/:view', school.updateForm)

router.get('/:school_urn/delete', school.action('delete'))
router.post('/:school_urn/delete', school.delete)

router.get('/:school_urn/sessions', school.readSessions)

router.all('/:school_urn', school.readPatients)
router.post('/:school_urn', school.filterPatients)

router.get('/:school_urn{/:view}', school.show)

export const schoolRoutes = router
