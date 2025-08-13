import { Session } from '../models/session.js'
import { formatDate, today } from '../utils/date.js'
import { getSessionConsentUrl } from '../utils/session.js'

export const navigation = (request, response, next) => {
  const { data } = request.session

  // Get currently active section
  let activeSection = request.path.split('/')[1]
  if (activeSection === 'programmes' && request.query.activity) {
    activeSection = 'sessions'
  }

  // Get programme sessions
  const sessions = Session.findAll(data)

  response.locals.navigation = {
    activeSection,
    referrer: request.originalUrl,
    consentUrl: {
      SeasonalFlu: getSessionConsentUrl(sessions, 'SeasonalFlu'),
      HPV: getSessionConsentUrl(sessions, 'HPV'),
      Doubles: getSessionConsentUrl(sessions, 'Doubles')
    }
  }

  // Show environment date in footer
  response.locals.today = formatDate(today(), { dateStyle: 'long' })

  next()
}
