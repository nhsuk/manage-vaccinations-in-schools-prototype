import { getAcademicYear, isBetweenDates, today } from '../utils/date.js'

export const rollover = (request, response, next) => {
  response.app.locals.isRollover = isBetweenDates(
    today(),
    '2025-07-01',
    '2025-08-31'
  )

  response.app.locals.currentAcademicYear = getAcademicYear(today())

  next()
}
