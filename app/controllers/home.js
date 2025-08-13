import { UserRole } from '../enums.js'
import { Notice } from '../models/notice.js'

export const homeController = {
  redirect(request, response, next) {
    const { account } = request.app.locals

    if (account.role === UserRole.DataConsumer) {
      response.redirect('/programmes')
    } else {
      response.redirect('/dashboard')
    }
  },

  dashboard(request, response) {
    const { account } = request.app.locals
    const { data } = request.session

    if (account.role === UserRole.Nurse) {
      response.locals.notices = Notice.findAll(data).filter(
        ({ archivedAt }) => !archivedAt
      )
    }

    response.render('views/dashboard')
  },

  start(request, response) {
    response.render('views/start')
  }
}
