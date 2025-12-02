import { Notice } from '../models/notice.js'

export const noticeController = {
  read(request, response, next, notice_uuid) {
    const notice = Notice.findOne(notice_uuid, request.session.data)

    response.locals.notice = notice

    next()
  },

  readAll(request, response, next) {
    response.locals.notices = Notice.findAll(request.session.data).filter(
      ({ archivedAt }) => !archivedAt
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
