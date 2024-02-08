import express from 'express'
import { userController } from '../controllers/user.js'

const router = express.Router({ strict: true })

router.get('/', userController.list)

router.get('/new', userController.new)
router.post('/new', userController.create)

router.all('/:uuid*', userController.read)

router.get('/:uuid', userController.show)

router.get('/:uuid/edit', userController.edit)
router.post('/:uuid/edit', userController.update)

router.get('/:uuid/delete', userController.action('delete'))
router.post('/:uuid/delete', userController.delete)

export const userRoutes = router
