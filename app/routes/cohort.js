import express from 'express'
import { cohortController } from '../controllers/cohort.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', cohortController.redirect)

router.get('/new', cohortController.new)

router.all('/:uuid*', cohortController.read)

router.get('/:uuid', cohortController.show)

router.post('/:uuid*/?:form(new)/check-answers', cohortController.update)

router.all('/:uuid*/?:form(new)/:view', cohortController.readForm)
router.get('/:uuid*/?:form(new)/:view', cohortController.showForm)
router.post('/:uuid*/?:form(new)/:view', cohortController.updateForm)

export const cohortRoutes = router
