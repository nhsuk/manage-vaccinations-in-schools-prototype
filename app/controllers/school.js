import { SchoolPresenter } from '../presenters/school.js'

export const schoolController = {
  read(request, response, next, school_urn) {
    response.locals.school = SchoolPresenter.forOne(
      school_urn,
      request.session.data
    )

    next()
  },

  readAll(request, response, next) {
    response.locals.schools = SchoolPresenter.forAll(request.session.data)

    next()
  },

  show(request, response) {
    response.render(`school/show`)
  },

  list(request, response) {
    response.render('school/list')
  }
}
