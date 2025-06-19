import { UserRole } from '../models/user.js'

export const accountController = {
  changeRole(request, response) {
    request.session.data.token.role = request.body.role

    response.redirect(request.query.referrer || '/home')
  },

  login(request, response) {
    const { data } = request.session

    // CIS2
    const user = Object.values(data.users).at(-1)
    user.role = UserRole.ClinicalAdmin

    request.session.data.token = user

    response.redirect('/account/change-role')
  },

  logout(request, response) {
    delete request.session.data.token

    response.redirect('/')
  }
}
