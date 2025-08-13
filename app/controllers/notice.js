import { Notice } from '../models/notice.js'
import { Upload } from '../models/upload.js'

export const noticeController = {
  read(request, response, next, notice_uuid) {
    const notice = Notice.findOne(notice_uuid, request.session.data)

    response.locals.notice = notice
    response.locals.paths = {
      back: `/uploads/notices`,
      next: `/uploads/notices`
    }

    next()
  },

  readAll(request, response, next) {
    response.locals.notices = Notice.findAll(request.session.data).filter(
      ({ archivedAt }) => !archivedAt
    )

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

  archive(request, response) {
    const { notice_uuid } = request.params
    const { data } = request.session
    const { __, paths } = response.locals

    Notice.archive(notice_uuid, data)

    request.flash('success', __(`notice.archive.success`))

    response.redirect(paths.next)
  }
}
