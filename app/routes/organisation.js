import express from 'express'
import { organisationController } from '../controllers/organisation.js'

const router = express.Router({ strict: true })

router.all('/:code*', organisationController.read)

router.get('/:code/?:form(edit)', organisationController.edit)
router.post('/:code/?:form(edit)', organisationController.update)

router.all('/:code/?:form(edit)/:view', organisationController.readForm)
router.get('/:code/?:form(edit)/:view', organisationController.showForm)
router.post('/:code/?:form(edit)/:view', organisationController.updateForm)

export const organisationRoutes = router
