export const navigation = (request, response, next) => {
  const { data } = request.session
  const { __ } = response.locals

  const accountLabel = data?.token?.email || __('account.show.title')

  response.locals.navigation = {
    primaryLinks: [
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
    ]
  }

  next()
}
