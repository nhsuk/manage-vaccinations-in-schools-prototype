import express from 'express'

import { clinicController as clinic } from '../controllers/clinic.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/new', clinic.form('new'))
router.post('/new', clinic.create)

router.param('clinic_id', clinic.read)

router.get('/:clinic_id/edit', clinic.form('edit'))
router.post('/:clinic_id/edit', clinic.update)

router.get('/:clinic_id/delete', clinic.action('delete'))
router.post('/:clinic_id/delete', clinic.delete)

export const clinicRoutes = router
