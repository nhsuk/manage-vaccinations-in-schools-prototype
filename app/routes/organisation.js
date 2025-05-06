import express from 'express'

import { organisationController as organisation } from '../controllers/organisation.js'

const router = express.Router({ strict: true })

router.param('organisation_code', organisation.read)

router.get('/:organisation_code', organisation.redirect)

router.all('/:organisation_code/edit/:view', organisation.readForm)
router.get('/:organisation_code/edit/:view', organisation.showForm)
router.post('/:organisation_code/edit/:view', organisation.updateForm)

router.get('/:organisation_code{/:view}', organisation.show)

export const organisationRoutes = router
