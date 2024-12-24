import { Clinic } from '../models/clinic.js'

export const clinicController = {
  new(request, response) {
    const { code } = request.params

    const clinic = new Clinic()

    response.redirect(`/organisations/${code}/clinics/${clinic.id}/new`)
  },

  create(request, response) {
    const { code, id } = request.params
    const { data } = request.session
    const { __, paths } = response.locals

    const clinic = new Clinic({
      ...request.body.clinic,
      ...{ id },
      organisation_code: code
    })

    request.flash('success', __(`clinic.new.success`, { clinic }))

    clinic.create(clinic, data)

    response.redirect(paths.next)
  },

  read(request, response, next) {
    const { code, id } = request.params
    const { data } = request.session

    response.locals.clinic = Clinic.read(id, data)
    response.locals.paths = {
      back: `/organisations/${code}/clinics`,
      next: `/organisations/${code}/clinics`
    }

    next()
  },

  show(request, response) {
    const { form } = request.params

    response.render('clinic/form', { form })
  },

  update(request, response) {
    const { data } = request.session
    const { __, clinic, paths } = response.locals

    // Clean up session data
    delete data.clinic

    // Update clinic
    clinic.update(request.body.clinic, data)

    request.flash('success', __(`clinic.edit.success`, { clinic }))

    response.redirect(paths.next)
  },

  action(type) {
    return (request, response) => {
      response.render('clinic/action', { type })
    }
  },

  delete(request, response) {
    const { data } = request.session
    const { __, clinic, paths } = response.locals

    request.flash('success', __(`clinic.delete.success`))

    clinic.delete(data)

    response.redirect(paths.next)
  }
}
