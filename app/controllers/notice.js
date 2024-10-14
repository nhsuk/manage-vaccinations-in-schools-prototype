import { Notice } from '../models/notice.js'
import { Patient } from '../models/patient.js'

export const noticeController = {
  readAll(request, response, next) {
    const { data } = request.session

    const notices = Object.values(data.notices).map((notice) => {
      notice = new Notice(notice)

      notice.patient = new Patient(data.patients[notice.patient_uuid])

      notice.name = notice.patient.notices[0].name

      return notice
    })

    response.locals.notices = notices

    next()
  },

  showAll(request, response) {
    response.render('notice/list')
  }
}
