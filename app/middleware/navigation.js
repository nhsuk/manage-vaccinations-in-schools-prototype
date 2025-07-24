import { Session } from '../models/session.js'
import { formatDate, today } from '../utils/date.js'
import { getProgrammeSession } from '../utils/session.js'

export const navigation = (request, response, next) => {
  const { data } = request.session

  // Get currently active section
  let activeSection = request.path.split('/')[1]
  if (activeSection === 'programmes' && request.query.activity) {
    activeSection = 'sessions'
  }

  // Get programme sessions
  const sessions = Session.readAll(data)
  const fluSession = getProgrammeSession(sessions, 'flu-2025')
  const hpvSession = getProgrammeSession(sessions, 'hpv-2024')
  const tioSession = getProgrammeSession(sessions, 'td-ipv-2024')

  response.locals.navigation = {
    activeSection,
    referrer: request.originalUrl,
    footer: {
      ...(fluSession && {
        title: 'Flu',
        items: [
          {
            text: 'Flu consent',
            href: `${fluSession.consentUrl}/start`
          },
          {
            text: 'Flu consent emails',
            href: `${fluSession.consentUrl}/emails`
          },
          {
            text: 'Flu consent texts',
            href: `${fluSession.consentUrl}/texts`
          }
        ]
      }),
      ...(hpvSession && {
        title: 'HPV',
        items: [
          {
            text: 'HPV consent',
            href: `${hpvSession.consentUrl}/start`
          },
          {
            text: 'HPV consent emails',
            href: `${hpvSession.consentUrl}/emails`
          },
          {
            text: 'HPV consent texts',
            href: `${hpvSession.consentUrl}/texts`
          }
        ]
      }),
      ...(tioSession && {
        title: 'MenACWY & Td/IPV',
        items: [
          {
            text: 'MenACWY & Td/IPV consent',
            href: `${tioSession.consentUrl}/start`
          },
          {
            text: 'MenACWY & Td/IPV consent emails',
            href: `${tioSession.consentUrl}/emails`
          },
          {
            text: 'MenACWY & Td/IPV consent texts',
            href: `${tioSession.consentUrl}/texts`
          }
        ]
      })
    }
  }

  // Show environment date in footer
  response.locals.today = formatDate(today(), { dateStyle: 'long' })

  next()
}
