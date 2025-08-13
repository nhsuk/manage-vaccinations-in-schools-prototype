import { Notice } from '../models/notice.js'
import { Upload } from '../models/upload.js'

export const noticeController = {
  read(request, response, next, notice_uuid) {
    const notice = Notice.read(notice_uuid, request.session.data)

    response.locals.notice = notice
    response.locals.paths = {
      back: `/uploads/notices`,
      next: `/uploads/notices`
    }

    next()
  },

  readAll(request, response, next) {
    response.locals.notices = Notice.findAll(request.session.data)

    // Required to show number of reviews in upload section navigation
    response.locals.reviews = Upload.findAll(request.session.data).flatMap(
      (upload) => upload.duplicates
    )

    next()
  },

  list(request, response) {
    response.render('notice/list')
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
