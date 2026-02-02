import { User } from '../models.js'

export const userController = {
  read(request, response, next, user_uid) {
    response.locals.user = User.findOne(user_uid, request.session.data)

    next()
  },

  readAll(request, response, next) {
    response.locals.users = User.findAll(request.session.data)

    next()
  },

  show(request, response) {
    response.render('user/show')
  },

  list(request, response) {
    response.render('user/list')
  }
}
