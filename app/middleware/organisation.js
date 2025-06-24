import { Organisation } from '../models/organisation.js'

export const organisation = (request, response, next) => {
  const { data } = request.session

  request.app.locals.organisation = new Organisation(data.organisation)

  next()
}
