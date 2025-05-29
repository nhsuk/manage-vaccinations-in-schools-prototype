import { Consent } from '../models/consent.js'
import { Move } from '../models/move.js'
import { Notice } from '../models/notice.js'
import { Organisation } from '../models/organisation.js'
import { Session } from '../models/session.js'
import { Upload } from '../models/upload.js'
import { User, UserRole } from '../models/user.js'
import { formatDate, today } from '../utils/date.js'
import { getSessionConsentUrl } from '../utils/session.js'

export const navigation = (request, response, next) => {
  const { data } = request.session
  const { __ } = response.locals

  const organisation = new Organisation(data.organisation)
  const user = new User(data.token)

  let root = request.path.split('/')[1]
  if (root === 'programmes' && request.query.activity) {
    root = 'sessions'
  }

  const consents = Consent.readAll(data)
  const moves = Move.readAll(data)
  const notices = Notice.readAll(data)
  const sessions = Session.readAll(data)
  const reviews = Upload.readAll(data).flatMap((upload) => upload.duplicates)

  // Get account navigation
  const account = data.token
    ? {
        user: {
          text: `${user.fullName} (${user.role})`
        },
        items: [
          {
            label: { text: __('account.change-role.label') },
            href: '/account/change-role'
          },
          {
            label: { text: __('account.sign-out.title') },
            href: '/account/sign-out'
          }
        ]
      }
    : {
        items: [
          {
            label: { text: __('account.sign-in.title') },
            href: '/start'
          }
        ]
      }

  // Get currently active section
  const current = root

  const primaryLinks =
    data.token?.role !== UserRole.DataConsumer
      ? [
          {
            url: '/programmes',
            label: __('programme.list.label'),
            current: current === 'programmes'
          },
          {
            url: '/sessions',
            label: __('session.list.label'),
            current: current === 'sessions'
          },
          {
            url: '/patients',
            label: __('patient.list.label'),
            current: current === 'patients'
          },
          {
            url: '/consents',
            label: __('consent.list.label'),
            classes: 'app-header__navigation-item--with-count',
            count: consents.length,
            current: current === 'consents'
          },
          {
            url: '/moves',
            label: __('move.list.label'),
            classes: 'app-header__navigation-item--with-count',
            count: moves.length,
            current: current === 'moves'
          },
          {
            url: '/vaccines',
            label: __('vaccine.list.label'),
            current: current === 'vaccines'
          },
          {
            url: '/uploads',
            label: __('upload.list.label'),
            classes: 'app-header__navigation-item--with-count',
            count: notices.length + reviews.length,
            current: current === 'uploads'
          },
          {
            url: organisation.uri,
            label: __('organisation.show.label'),
            current: current === 'organisations'
          }
        ]
      : []

  response.locals.navigation = {
    account,
    primaryLinks,
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
