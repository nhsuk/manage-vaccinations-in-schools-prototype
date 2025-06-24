import { Consent } from '../models/consent.js'
import { Move } from '../models/move.js'
import { Notice } from '../models/notice.js'
import { Session } from '../models/session.js'
import { Upload } from '../models/upload.js'
import { formatDate, today } from '../utils/date.js'
import { getProgrammeSession } from '../utils/session.js'

export const navigation = (request, response, next) => {
  const { data } = request.session

  // Get item counts (to show in navigation and elsewhere)
  const notices = Notice.readAll(data)
  const reviews = Upload.readAll(data).flatMap((upload) => upload.duplicates)
  const sessions = Session.readAll(data)

  response.locals.counts = {
    consents: Consent.readAll(data).length,
    moves: Move.readAll(data).length,
    notices: notices.length,
    sessions: sessions.length,
    reviews: reviews.length,
    uploads: notices.length + reviews.length
  }

  // Get currently active section
  let activeSection = request.path.split('/')[1]
  if (activeSection === 'programmes' && request.query.activity) {
    activeSection = 'sessions'
  }

  const fluSession = getProgrammeSession(sessions, 'flu-2025')
  const hpvSession = getProgrammeSession(sessions, 'hpv-2024')
  const tioSession = getProgrammeSession(sessions, 'td-ipv-2024')

  response.locals.navigation = {
    activeSection,
    referrer: request.originalUrl,
    footerLinks: [
      ...(fluSession
        ? [
            [
              {
                URL: `${fluSession.consentUrl}/start`,
                label: 'Flu consent'
              },
              {
                URL: `${fluSession.consentUrl}/emails`,
                label: 'Flu consent emails'
              },
              {
                URL: `${fluSession.consentUrl}/texts`,
                label: 'Flu consent texts'
              }
            ]
          ]
        : []),
      ...(hpvSession
        ? [
            [
              {
                URL: `${hpvSession.consentUrl}/start`,
                label: 'HPV consent'
              },
              {
                URL: `${hpvSession.consentUrl}/emails`,
                label: 'HPV consent emails'
              },
              {
                URL: `${hpvSession.consentUrl}/texts`,
                label: 'HPV consent texts'
              }
            ]
          ]
        : []),
      ...(tioSession
        ? [
            [
              {
                URL: `${tioSession.consentUrl}/start`,
                label: 'MenACWY & Td/IPV consent'
              },
              {
                URL: `${tioSession.consentUrl}/emails`,
                label: 'MenACWY & Td/IPV consent emails'
              },
              {
                URL: `${tioSession.consentUrl}/texts`,
                label: 'MenACWY & Td/IPV consent texts'
              }
            ]
          ]
        : [])
    ]
  }

  // Show environment date in footer
  response.locals.today = formatDate(today(), { dateStyle: 'long' })

  next()
}
