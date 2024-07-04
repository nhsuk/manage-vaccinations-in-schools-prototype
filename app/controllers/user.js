import { User } from '../models/user.js'

export const userController = {
  list(request, response) {
    const { data } = request.session

    response.render('users/list', {
      users: Object.values(data.users).map((user) => new User(user))
    })
  },

  show(request, response) {
    response.render('users/show')
  },

  read(request, response, next) {
    const { data } = request.session
    const { uid } = request.params

    request.app.locals.user = new User(data.users[uid])

    next()
  }
}
