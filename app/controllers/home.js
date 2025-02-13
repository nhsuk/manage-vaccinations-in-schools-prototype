import { Notice } from '../models/notice.js'
import { UserRole } from '../models/user.js'

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

    if (data.token?.role === UserRole.ClinicalAdmin) {
      response.locals.notices = Notice.readAll(data)
    }

    response.render('views/dashboard')
  }
}
