import express from 'express'

import { sessionController as session } from '../controllers/session.js'

const router = express.Router({ strict: true })

router.get('/', session.readAll, session.list('active'))
router.get('/completed', session.readAll, session.list('completed'))
router.get('/planned', session.readAll, session.list('planned'))
router.get('/unplanned', session.readAll, session.list('unplanned'))
router.get('/closed', session.readAll, session.list('closed'))

router.param('session_id', session.read)

router.post('/:session_id/offline', session.downloadFile)

router.get('/:session_id/edit', session.edit)
router.post('/:session_id/edit', session.update)

router.all('/:session_id/edit/:view', session.readForm)
router.get('/:session_id/edit/:view', session.showForm)
router.post('/:session_id/edit/:view', session.updateForm)

router.post('/:session_id/close', session.close)
router.post('/:session_id/default-batch', session.updateDefaultBatch)

router.all('/:session_id/:view', session.readPatientSessions)
router.post('/:session_id/:view', session.filterPatientSessions)

router.get('/:session_id{/:view}', session.show)

export const sessionRoutes = router
