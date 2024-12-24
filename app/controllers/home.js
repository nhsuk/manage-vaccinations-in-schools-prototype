import { UserRole } from '../models/user.js'

export const homeController = {
  redirect(request, response, next) {
    const { data } = request.session

    if (data.token?.role === UserRole.DataConsumer) {
      response.redirect('/programmes')
    } else {
      response.redirect('/dashboard')
    }
  }
}
