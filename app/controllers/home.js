import { UserRole } from '../enums.js'
import { Notice } from '../models/notice.js'

export const homeController = {
  redirect(request, response, next) {
    const { data } = request.session

    if (data.token?.role === UserRole.DataConsumer) {
      response.redirect('/programmes')
    } else {
      response.redirect('/dashboard')
    }
  },

  dashboard(request, response) {
    const { data } = request.session

    if (data.token?.role === UserRole.Nurse) {
      response.locals.notices = Notice.readAll(data)
    }

    response.render('views/dashboard')
  },

  start(request, response) {
    response.render('views/start')
  }
}
