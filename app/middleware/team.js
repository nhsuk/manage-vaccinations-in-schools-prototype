import { Team } from '../models/team.js'

export const team = (request, response, next) => {
  const { data } = request.session

  request.app.locals.team = new Team(data.team)

  next()
}
