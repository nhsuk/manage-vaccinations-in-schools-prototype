import express from 'express'

import { clinicController } from '../controllers/clinic.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/new', clinicController.new)

router.all('/:id/?:form(new|edit|delete)', clinicController.read)
router.get('/:id/?:form(new|edit)', clinicController.show)
router.post('/:id/?:form(new)', clinicController.create)
router.post('/:id/?:form(edit)', clinicController.update)

router.get('/:id/delete', clinicController.action('delete'))
router.post('/:id/delete', clinicController.delete)

export const clinicRoutes = router
