import { Clinic } from '../models/clinic.js'
import { Organisation } from '../models/organisation.js'

export const organisationController = {
  redirect(request, response, next) {
    const { code } = request.params

    response.redirect(`${code}/contact`)
  },

  read(request, response, next) {
    const { code, view } = request.params
    const { data } = request.session
    const { __ } = response.locals

    const organisation = new Organisation(data.organisations[code])
    const clinics = organisation.ids.map((id) => new Clinic(data.clinics[id]))

    request.app.locals.organisation = organisation
    request.app.locals.clinics = clinics

    response.locals.navigationItems = [
      {
        text: __('organisation.contact.title'),
        href: `${organisation.uri}/contact`,
        current: view.includes('contact')
      },
      {
        text: __('organisation.clinics.title'),
        href: `${organisation.uri}/clinics`,
        current: view.includes('clinics')
      },
      {
        text: __('organisation.schools.title'),
        href: `${organisation.uri}/schools`,
        current: view.includes('schools')
      },
      {
        text: __('organisation.sessions.title'),
        href: `${organisation.uri}/sessions`,
        current: view.includes('sessions')
      }
    ]

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`organisation/${view}`)
  },

  readForm(request, response, next) {
    const { organisation } = request.app.locals
    const { view } = request.params
    const { data } = request.session

    const referrers = {
      contact: `${organisation.uri}/contact`,
      sessions: `${organisation.uri}/sessions`,
      password: `${organisation.uri}/sessions`
    }

    request.app.locals.organisation = new Organisation({
      ...organisation,
      ...data?.wizard?.organisation // Wizard values
    })

    response.locals.paths = {
      back: referrers[view],
      next: referrers[view]
    }

    next()
  },

  showForm(request, response) {
    const view = request.params.view || 'contact'

    response.render(`organisation/form/${view}`)
  },

  updateForm(request, response) {
    const { organisation } = request.app.locals
    const { data } = request.session
    const { __, paths } = response.locals

    const updatedOrganisation = new Organisation(
      Object.assign(
        organisation, // Previous values
        request.body.organisation // New values
      )
    )

    data.organisations[updatedOrganisation.code] = updatedOrganisation

    request.flash('success', __(`organisation.success.update`))

    response.redirect(paths.next)
  }
}
