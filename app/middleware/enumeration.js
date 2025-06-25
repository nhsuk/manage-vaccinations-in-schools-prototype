import * as enums from '../enums.js'

export const enumeration = (request, response, next) => {
  response.app.locals = { ...response.app.locals, ...enums }

  next()
}
