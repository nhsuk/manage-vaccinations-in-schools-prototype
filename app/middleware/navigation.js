import { Organisation } from '../models/organisation.js'
import { ProgrammeType } from '../models/programme.js'
import { User, UserRole } from '../models/user.js'
import { formatDate, getToday } from '../utils/date.js'
import { getProgrammeSession } from '../utils/session.js'

export const navigation = (request, response, next) => {
  const { data } = request.session
  const { __ } = response.locals
  const { sessions } = data

  const organisation = new Organisation(data.organisation)
  const user = new User(data.token)
  const root = request.path.split('/')[1]

  // Get account navigation
  const account = data.token
    ? {
        user: {
          text: user.fullName
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
  let current = root

  const primaryLinks =
    data.token?.role != UserRole.DataConsumer
      ? [
          {
            url: '/programmes',
            label: __('programme.list.title'),
            current: current === 'programmes'
          },
          {
            url: '/sessions',
            label: __('session.list.title'),
            current: current === 'sessions'
          },
          {
            url: '/patients',
            label: __('patient.list.title'),
            current: current === 'patients'
          },
          {
            url: '/vaccines',
            label: __('vaccine.list.title'),
            current: current === 'vaccines'
          },
          {
            url: '/notices',
            label: __('notice.list.title'),
            current: current === 'notices'
          },
          {
            url: organisation.uri,
            label: __('organisation.show.title'),
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
                label: 'Flu consent journey'
              },
              {
                URL: `/consents/${fluClinic.id}`,
                label: 'Flu consent journey (clinic)'
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
                label: 'HPV consent journey'
              },
              {
                URL: `/consents/${hpvClinic.id}`,
                label: 'HPV consent journey (clinic)'
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
                label: '3-in-1 consent journey'
              },
              {
                URL: `/consents/${tioClinic.id}`,
                label: '3-in-1 consent journey (clinic)'
              },
              {
                URL: `/consents/${tioSession.id}/emails`,
                label: '3-in-1 consent emails'
              },
              {
                URL: `/consents/${tioSession.id}/texts`,
                label: '3-in-1 consent texts'
              }
            ]
          ]
        : [])
    ]
  }

  // Show environment date in footer
  response.locals.today = formatDate(getToday(), { dateStyle: 'long' })

  next()
}
