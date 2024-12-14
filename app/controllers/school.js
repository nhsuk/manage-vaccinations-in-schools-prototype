import { School } from '../models/school.js'

export const schoolController = {
  readAll(request, response, next) {
    const { data } = request.session

    response.locals.schools = School.readAll(data)

    next()
  },

  showAll(request, response) {
    response.render('school/list')
  },

  read(request, response, next) {
    const { urn } = request.params
    const { data } = request.session

    response.locals.school = School.read(urn, data)

    next()
  },

  show(request, response) {
    response.render(`school/show`)
  }
}
