import { UserRole } from '../enums.js'

export const accountController = {
  changeRole(request, response) {
    request.session.data.token.role = request.body.role

    response.redirect(request.query.referrer || '/home')
  },

  cis2(request, response) {
    const { data } = request.session

    const user = Object.values(data.users).at(-1)
    user.role = UserRole.Nurse

    request.session.data.token = user

    response.redirect('/account/change-role')
  },

  login(request, response) {
    const { data } = request.session
    const { role } = request.query

    const user = Object.values(data.users).at(-1)
    user.role = role || UserRole.Nurse

    request.session.data.token = user

    response.redirect('/home')
  },

  logout(request, response) {
    delete request.session.data.token

    response.redirect('/start')
  }
}
