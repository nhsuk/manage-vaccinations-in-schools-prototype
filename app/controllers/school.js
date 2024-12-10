import { School } from '../models/school.js'

export const schoolController = {
  readAll(request, response, next) {
    const { data } = request.session

    const schools = Object.values(data.schools).map(
      (school) => (school = new School(school, data))
    )

    response.locals.schools = schools

    next()
  },

  showAll(request, response) {
    response.render('school/list')
  },

  read(request, response, next) {
    const { urn } = request.params
    const { schools } = response.locals

    const school = schools.find((school) => school.urn === Number(urn))

    response.locals.school = school

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`school/${view}`)
  }
}
