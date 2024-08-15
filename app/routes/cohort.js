import express from 'express'
import { cohortController } from '../controllers/cohort.js'

const router = express.Router({ strict: true, mergeParams: true })

router.get('/', cohortController.redirect)

router.get('/new', cohortController.new)

router.post('/?:form(new)/check-answers', cohortController.update)

router.all('/?:form(new)/:view', cohortController.readForm)
router.get('/?:form(new)/:view', cohortController.showForm)
router.post('/?:form(new)/:view', cohortController.updateForm)

export const cohortRoutes = router
