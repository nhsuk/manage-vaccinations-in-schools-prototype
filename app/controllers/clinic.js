import { Clinic } from '../models/clinic.js'
import { ClinicPresenter } from '../presenters/clinic.js'

export const clinicController = {
  read(request, response, next, clinic_id) {
    const clinic = ClinicPresenter.forOne(clinic_id, request.session.data)

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

    const clinic = Clinic.create(
      {
        ...request.body.clinic,
        organisation_code
      },
      data
    )

    request.flash('success', __(`clinic.new.success`, { clinic }))

    response.redirect(`/organisations/${clinic.organisation_code}/clinics`)
  },

  update(request, response) {
    const { clinic_id } = request.params
    const { data } = request.session
    const { __, paths } = response.locals

    // Clean up session data
    delete data.clinic

    // Update session data
    const clinic = Clinic.update(clinic_id, request.body.clinic, data)

    request.flash('success', __(`clinic.edit.success`, { clinic }))

    response.redirect(paths.next)
  },

  delete(request, response) {
    const { clinic_id } = request.params
    const { data } = request.session
    const { __, paths } = response.locals

    Clinic.delete(clinic_id, data)

    request.flash('success', __(`clinic.delete.success`))

    response.redirect(paths.next)
  }
}
