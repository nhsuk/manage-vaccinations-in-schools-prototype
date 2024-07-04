import { UserRole } from '../models/user.js'

export const accountController = {
  changeRole(request, response) {
    response.redirect('/home')
  },

  login(request, response) {
    const { email } = request.body
    const { data } = request.session

    // Username/Password
    const user = Object.values(data.users).find((user) => user.email === email)

    // CIS2
    const cis2User = Object.values(data.users).at(-1)
    cis2User.role = UserRole.ClinicalAdmin

    request.session.data.token = user || cis2User

    response.redirect('/account/change-role')
  },

  logout(request, response) {
    delete request.session.data.token

    response.redirect('/')
  }
}
