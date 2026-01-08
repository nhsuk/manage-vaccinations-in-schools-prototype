import express from 'express'

import { schoolController as school } from '../controllers/school.js'

const router = express.Router({ strict: true })

router.get('/', school.readAll, school.list)
router.post('/', school.filterList)

router.param('school_id', school.read)

router.get('/:school_id/edit', school.edit)
router.post('/:school_id/edit', school.update('edit'))

router.all('/:school_id/edit/:view', school.readForm('edit'))
router.get('/:school_id/edit/:view', school.showForm)
router.post('/:school_id/edit/:view', school.updateForm)

router.get('/:school_id/delete', school.action('delete'))
router.post('/:school_id/delete', school.delete)

router.get('/:school_id/sessions', school.readSessions)

router.all('/:school_id', school.readPatients)
router.post('/:school_id', school.filterPatients)

router.get('/:school_id{/:view}', school.show)

export const schoolRoutes = router
