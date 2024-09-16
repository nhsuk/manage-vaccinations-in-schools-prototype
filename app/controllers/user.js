import { User } from '../models/user.js'

export const userController = {
  readAll(request, response, next) {
    const { data } = request.session

    const users = Object.values(data.users).map((user) => new User(user))

    response.locals.users = users

    next()
  },

  showAll(request, response) {
    response.render('user/list')
  },

  read(request, response, next) {
    const { uid } = request.params
    const { users } = response.locals

    const user = users.find((user) => user.uid === uid)

    response.locals.user = user

    next()
  },

  show(request, response) {
    response.render('user/show')
  }
}
