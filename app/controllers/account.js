import { User } from '../models/user.js'

export const accountController = {
  resetPassword(request, response) {
    response.render('account/reset-password')
  },

  signIn(request, response) {
    response.render('account/sign-in')
  },

  login(request, response) {
    const { email } = request.body
    const { data } = request.session

    const user = Object.values(data.users).find((user) => user.email === email)

    const fallbackUser = Object.values(data.users).at(-1)
    fallbackUser.admin = true

    request.session.data.token = user || fallbackUser

    response.redirect('/dashboard')
  },

  logout(request, response) {
    delete request.session.data.token

    response.redirect('/')
  },

  edit(request, response) {
    const { __ } = response.locals

    response.render('users/edit', {
      headingSize: 'xl',
      paths: false,
      title: __('account.show.title')
    })
  },

  read(request, response, next) {
    const { data } = request.session

    request.app.locals.user = data.token && new User(data.token)

    next()
  },

  update(request, response) {
    const { user } = request.app.locals
    const { __ } = response.locals

    request.session.data.users[user.uuid] = new User({
      ...user,
      ...request.body.user
    })
    request.flash('success', __(`account.success.update`))

    response.redirect(request.originalUrl)
  }
}
