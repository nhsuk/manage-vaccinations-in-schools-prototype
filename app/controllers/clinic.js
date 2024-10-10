import { Clinic } from '../models/clinic.js'
import { Organisation } from '../models/organisation.js'

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
      ...{ id }
    })

    // Add to session data
    data.clinics[clinic.id] = clinic

    // Add to organisation
    data.organisations[code].ids.push(clinic.id)

    request.flash('success', __(`clinic.success.create`, { clinic }))

    response.redirect(paths.next)
  },

  read(request, response, next) {
    const { code, id } = request.params
    const { data } = request.session

    response.locals.clinic = new Clinic(data.clinics[id])
    response.locals.organisation = new Organisation(data.organisations[code])

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
    const { id } = request.params
    const { data } = request.session
    const { __, clinic, paths } = response.locals

    const updatedClinic = new Clinic({
      ...clinic,
      ...request.body.clinic
    })

    // Update session data
    data.clinics[id] = updatedClinic

    // Clean up session data
    delete data.clinic

    request.flash(
      'success',
      __(`clinic.success.update`, { clinic: updatedClinic })
    )

    response.redirect(paths.next)
  },

  action(type) {
    return (request, response) => {
      response.render('clinic/action', { type })
    }
  },

  delete(request, response) {
    const { code, id } = request.params
    const { data } = request.session
    const { __, organisation, paths } = response.locals

    // Remove from session data
    delete data.clinics[id]

    // Remove from organisation
    data.organisations[code].ids = organisation.ids.filter(
      (item) => item !== id
    )

    request.flash('success', __(`clinic.success.delete`))

    response.redirect(paths.next)
  }
}
