import { Clinic } from '../models/clinic.js'

export const clinicController = {
  read(request, response, next, clinic_id) {
    const clinic = Clinic.read(clinic_id, request.session.data)

    response.locals.clinic = clinic
    response.locals.paths = {
      back: `/organisations/${clinic.organisation_code}/clinics`,
      next: `/organisations/${clinic.organisation_code}/clinics`
    }

    next()
  },

  form(type) {
    return (request, response) => {
      response.render('clinic/form', { type })
    }
  },

  action(type) {
    return (request, response) => {
      response.render('clinic/action', { type })
    }
  },

  create(request, response) {
    const { organisation_code } = request.params
    const { data } = request.session
    const { __ } = response.locals

    const clinic = new Clinic({
      ...request.body.clinic,
      organisation_code
    })

    request.flash('success', __(`clinic.new.success`, { clinic }))

    clinic.create(clinic, data)

    response.redirect(`/organisations/${clinic.organisation_code}/clinics`)
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

  delete(request, response) {
    const { data } = request.session
    const { __, clinic, paths } = response.locals

    request.flash('success', __(`clinic.delete.success`))

    clinic.delete(data)

    response.redirect(paths.next)
  }
}
