import { SessionStatus } from '../models/session.js'
import { User, UserRole } from '../models/user.js'
import { getCampaignSession } from '../utils/session.js'

export const navigation = (request, response, next) => {
  const { data } = request.session
  const { __ } = response.locals
  const { campaigns, sessions } = data

  const user = new User(data.token)
  const root = request.path.split('/')[1]
  const id = request.path.split('/')[2]

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
  if (root === 'sessions' && id) {
    const { status } = data.sessions[id]
    if (status === SessionStatus.Active) {
      current = 'sessions'
    } else {
      current = 'campaigns'
    }
  }

  const primaryLinks =
    data.token?.role != UserRole.DataConsumer
      ? [
          {
            url: '/sessions',
            label: __('session.list.title'),
            current: current === 'sessions'
          },
          {
            url: '/campaigns',
            label: __('campaign.list.title'),
            current: current === 'campaigns'
          },
          {
            url: '/vaccines',
            label: __('vaccine.list.title'),
            current: current === 'vaccines'
          }
        ]
      : []

  const fluSession = getCampaignSession(campaigns, sessions, 'flu')
  const hpvSession = getCampaignSession(campaigns, sessions, 'hpv')
  const tioSession = getCampaignSession(campaigns, sessions, '3-in-1-men-acwy')

  response.locals.navigation = {
    account,
    primaryLinks,
    footerLinks: [
      ...(fluSession
        ? [
            [
              {
                URL: `/consents/${fluSession.id}`,
                label: `${__('consent.start.flu.label')} journey`
              },
              {
                URL: `/consents/${fluSession.id}/emails`,
                label: `${__('consent.start.flu.label')} emails`
              },
              {
                URL: `/consents/${fluSession.id}/texts`,
                label: `${__('consent.start.flu.label')} texts`
              }
            ]
          ]
        : []),
      ...(hpvSession
        ? [
            [
              {
                URL: `/consents/${hpvSession.id}`,
                label: `${__('consent.start.hpv.label')} journey`
              },
              {
                URL: `/consents/${hpvSession.id}/emails`,
                label: `${__('consent.start.hpv.label')} emails`
              },
              {
                URL: `/consents/${hpvSession.id}/texts`,
                label: `${__('consent.start.hpv.label')} texts`
              }
            ]
          ]
        : []),
      ...(tioSession
        ? [
            [
              {
                URL: `/consents/${tioSession.id}`,
                label: `${__('consent.start.3-in-1-men-acwy.label')} journey`
              },
              {
                URL: `/consents/${tioSession.id}/emails`,
                label: `${__('consent.start.3-in-1-men-acwy.label')} emails`
              },
              {
                URL: `/consents/${tioSession.id}/texts`,
                label: `${__('consent.start.3-in-1-men-acwy.label')} texts`
              }
            ]
          ]
        : [])
    ]
  }

  next()
}
