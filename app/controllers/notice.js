import { Notice } from '../models/notice.js'

export const noticeController = {
  read(request, response, next) {
    const { uuid } = request.params
    const { data } = request.session

    response.locals.notice = Notice.read(uuid, data)
    response.locals.paths = {
      back: `/notices`,
      next: `/notices`
    }

    next()
  },

  action(type) {
    return (request, response) => {
      response.render('notice/action', { type })
    }
  },

  delete(request, response) {
    const { data } = request.session
    const { __, notice, paths } = response.locals

    request.flash('success', __(`notice.delete.success`))

    notice.delete(data)

    response.redirect(paths.next)
  }
}
