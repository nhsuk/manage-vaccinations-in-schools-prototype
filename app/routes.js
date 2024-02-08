import express from 'express'
import flash from 'express-flash'
import { enumeration } from './middleware/enumeration.js'
import { internationalisation } from './middleware/internationalisation.js'
import { navigation } from './middleware/navigation.js'
import { notification } from './middleware/notification.js'
import { users } from './middleware/users.js'
import { accountRoutes } from './routes/account.js'
import { userRoutes } from './routes/user.js'

const router = express.Router({ strict: true })

router.use(enumeration)
router.use(internationalisation)
router.use(flash(), navigation, notification, users)

router.use('/account', accountRoutes)
router.use('/users', userRoutes)

export default router
