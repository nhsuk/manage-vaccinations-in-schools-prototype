import { User } from '../models/user.js'

export const userController = {
  readAll(request, response, next) {
    const { data } = request.session

    response.locals.users = User.readAll(data)

    next()
  },

  showAll(request, response) {
    response.render('user/list')
  },

  read(request, response, next) {
    const { uid } = request.params
    const { data } = request.session

    response.locals.user = User.read(uid, data)

    next()
  },

  show(request, response) {
    response.render('user/show')
  }
}
