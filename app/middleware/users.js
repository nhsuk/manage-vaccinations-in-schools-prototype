import _ from 'lodash'

import { User } from '../models/user.js'

export const users = (request, response, next) => {
  const { data } = request.session

  const users = Object.values(data.users).map((user) => new User(user))

  request.app.locals.users = _.keyBy(users, 'uid')

  next()
}
