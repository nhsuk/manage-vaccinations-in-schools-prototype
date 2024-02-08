import { Registrar } from '../models/user.js'

export const enumeration = (request, response, next) => {
  response.locals.Registrar = Registrar

  next()
}
