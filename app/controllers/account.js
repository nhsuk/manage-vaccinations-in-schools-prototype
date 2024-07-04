export const accountController = {
  resetPassword(request, response) {
    response.render('account/reset-password')
  },

  signIn(request, response) {
    response.render('account/sign-in')
  },

  login(request, response) {
    const { email } = request.body
    const { data } = request.session

    const user = Object.values(data.users).find((user) => user.email === email)

    const fallbackUser = Object.values(data.users).at(-1)
    fallbackUser.admin = true

    request.session.data.token = user || fallbackUser

    response.redirect('/dashboard')
  },

  logout(request, response) {
    delete request.session.data.token

    response.redirect('/')
  }
}
