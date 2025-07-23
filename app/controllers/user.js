import { UserPresenter } from '../presenters/user.js'

export const userController = {
  read(request, response, next, user_uid) {
    response.locals.user = UserPresenter.forOne(user_uid, request.session.data)

    next()
  },

  readAll(request, response, next) {
    response.locals.users = UserPresenter.forAll(request.session.data)

    next()
  },

  show(request, response) {
    response.render('user/show')
  },

  list(request, response) {
    response.render('user/list')
  }
}
