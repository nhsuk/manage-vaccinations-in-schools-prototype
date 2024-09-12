import express from 'express'
import { UserRole } from '../models/user.js'

const router = express.Router({ strict: true })

router.get('/', (request, response) => {
  const { data } = request.session

  if (data.token?.role === UserRole.DataConsumer) {
    response.redirect('/programmes')
  } else {
    response.redirect('/dashboard')
  }
})

export const homeRoutes = router
