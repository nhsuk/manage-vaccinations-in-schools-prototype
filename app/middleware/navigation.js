import { Consent } from '../models/consent.js'
import { Move } from '../models/move.js'
import { Notice } from '../models/notice.js'
import { Organisation } from '../models/organisation.js'
import { ProgrammeType } from '../models/programme.js'
import { User, UserRole } from '../models/user.js'
import { formatDate, today } from '../utils/date.js'
import { getProgrammeSession } from '../utils/session.js'

export const navigation = (request, response, next) => {
  const { data } = request.session
  const { __ } = response.locals
  const { sessions } = data

  const organisation = new Organisation(data.organisation)
  const user = new User(data.token)
  const root = request.path.split('/')[1]

  response.locals.consents = Consent.readAll(data)
  response.locals.moves = Move.readAll(data)
  response.locals.notices = Notice.readAll(data)

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
            href: '/'
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
            count: response.locals.consents.length,
            current: current === 'consents'
          },
          {
            url: '/moves',
            label: __('move.list.label'),
            classes: 'app-header__navigation-item--with-count',
            count: response.locals.moves.length,
            current: current === 'moves'
          },
          {
            url: '/notices',
            label: __('notice.list.label'),
            classes: 'app-header__navigation-item--with-count',
            count: response.locals.notices.length,
            current: current === 'notices'
          },
          {
            url: '/vaccines',
            label: __('vaccine.list.label'),
            current: current === 'vaccines'
          },
          {
            url: organisation.uri,
            label: __('organisation.show.label'),
            current: current === 'organisations'
          }
        ]
      : []

  const fluSession = getProgrammeSession(sessions, ProgrammeType.Flu)
  const fluClinic = getProgrammeSession(sessions, ProgrammeType.Flu, false)
  const hpvSession = getProgrammeSession(sessions, ProgrammeType.HPV)
  const hpvClinic = getProgrammeSession(sessions, ProgrammeType.HPV, false)
  const tioSession = getProgrammeSession(sessions, ProgrammeType.TdIPV)
  const tioClinic = getProgrammeSession(sessions, ProgrammeType.TdIPV, false)

  response.locals.navigation = {
    account,
    primaryLinks,
    footerLinks: [
      ...(fluSession
        ? [
            [
              {
                URL: `/consents/${fluSession.id}`,
                label: 'Flu consent'
              },
              {
                URL: `/consents/${fluClinic.id}`,
                label: 'Flu consent (clinic)'
              },
              {
                URL: `/consents/${fluSession.id}/emails`,
                label: 'Flu consent emails'
              },
              {
                URL: `/consents/${fluSession.id}/texts`,
                label: 'Flu consent texts'
              }
            ]
          ]
        : []),
      ...(hpvSession
        ? [
            [
              {
                URL: `/consents/${hpvSession.id}`,
                label: 'HPV consent'
              },
              {
                URL: `/consents/${hpvClinic.id}`,
                label: 'HPV consent (clinic)'
              },
              {
                URL: `/consents/${hpvSession.id}/emails`,
                label: 'HPV consent emails'
              },
              {
                URL: `/consents/${hpvSession.id}/texts`,
                label: 'HPV consent texts'
              }
            ]
          ]
        : []),
      ...(tioSession
        ? [
            [
              {
                URL: `/consents/${tioSession.id}`,
                label: '‘Doubles’ consent'
              },
              {
                URL: `/consents/${tioClinic.id}`,
                label: '‘Doubles’ consent (clinic)'
              },
              {
                URL: `/consents/${tioSession.id}/emails`,
                label: '‘Doubles’ consent emails'
              },
              {
                URL: `/consents/${tioSession.id}/texts`,
                label: '‘Doubles’ consent texts'
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
