import { AcademicYear } from '../enums.js'
import { Programme } from '../models.js'
import { getCurrentAcademicYear } from '../utils/date.js'

export const programmeController = {
  read(request, response, next, programme_id) {
    response.locals.academicYear = AcademicYear[getCurrentAcademicYear()]

    response.locals.programme = Programme.findOne(
      programme_id,
      request.session.data
    )

    next()
  },

  readAll(request, response, next) {
    response.locals.academicYear = AcademicYear[getCurrentAcademicYear()]

    response.locals.programmes = Programme.findAll(request.session.data).filter(
      (programme) => !programme.hidden
    )

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`programme/${view}`)
  },

  list(request, response) {
    response.render('programme/list')
  }
}
