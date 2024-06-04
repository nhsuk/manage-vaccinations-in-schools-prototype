import { getCampaignSession } from '../utils/session.js'

export const navigation = (request, response, next) => {
  const { data } = request.session
  const { __ } = response.locals
  const { campaigns, sessions } = data

  const accountLabel = data?.token?.email || __('account.show.title')
  const fluSession = getCampaignSession(campaigns, sessions, 'flu')
  const hpvSession = getCampaignSession(campaigns, sessions, 'hpv')
  const tioSession = getCampaignSession(campaigns, sessions, '3-in-1-men-acwy')

  response.locals.navigation = {
    primaryLinks: [
      {
        url: '/sessions',
        label: __('session.list.title')
      },
      {
        url: '/campaigns',
        label: __('campaign.list.title')
      },
      {
        url: '/vaccines',
        label: __('vaccine.list.title')
      },
      {
        url: '/account',
        label: accountLabel
      },
      {
        url: '/account/sign-out',
        label: __('account.sign-out.title')
      }
    ],
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
