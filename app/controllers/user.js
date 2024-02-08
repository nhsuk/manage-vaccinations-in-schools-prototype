import { User } from '../models/user.js'

export const userController = {
  action(type) {
    return (request, response) => {
      response.render('users/action', { type })
    }
  },

  edit(request, response) {
    response.render('users/edit')
  },

  list(request, response) {
    const { data } = request.session

    response.render('users/list', {
      users: Object.values(data.users).map((user) => new User(user))
    })
  },

  new(request, response) {
    response.render('users/new')
  },

  show(request, response) {
    response.render('users/show')
  },

  create(request, response) {
    const { __ } = response.locals

    const user = new User(request.body.user)

    request.session.data.users[user.uuid] = user
    request.flash('success', __(`user.success.create`, { user }))

    response.redirect('/users')
  },

  read(request, response, next) {
    const { data } = request.session
    const { uuid } = request.params

    request.app.locals.user = new User(data.users[uuid])

    next()
  },

  update(request, response) {
    const { user } = request.app.locals
    const { __ } = response.locals

    request.session.data.users[user.uuid] = new User({
      ...user,
      ...request.body.user
    })
    request.flash('success', __(`user.success.update`, { user }))

    response.redirect(`/users/${user.uuid}`)
  },

  delete(request, response) {
    const { user } = request.app.locals
    const { __ } = response.locals
    const { data } = request.session

    delete data.users[user.uuid]

    request.flash('success', __(`user.success.delete`))

    response.redirect('/users')
  }
}
