import * as enums from '../enums.js'
import { addDays, formatDate } from '../utils/date.js'

export const enumeration = (request, response, next) => {
  response.app.locals = { ...response.app.locals, ...enums }

  const delayDate = addDays(new Date(), 28)

  response.app.locals.DelayDate = formatDate(delayDate, { dateStyle: 'long' })

  next()
}
