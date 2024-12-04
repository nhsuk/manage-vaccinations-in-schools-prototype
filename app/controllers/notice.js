import { Notice } from '../models/notice.js'

export const noticeController = {
  readAll(request, response, next) {
    const { data } = request.session

    const notices = Object.values(data.notices).map(
      (notice) => new Notice(notice, data)
    )

    response.locals.notices = notices

    next()
  },

  showAll(request, response) {
    response.render('notice/list')
  },

  read(request, response, next) {
    const { uuid } = request.params
    const { notices } = response.locals

    const notice = notices.find((notice) => notice.uuid === uuid)

    response.locals.notice = notice

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
    const { uuid } = request.params
    const { data } = request.session
    const { __ } = response.locals

    delete data.notices[uuid]

    request.flash('success', __(`notice.success.delete`))
    response.redirect('/notices')
  }
}
