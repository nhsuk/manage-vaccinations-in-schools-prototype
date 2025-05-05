import { Organisation } from '../models/organisation.js'

export const organisationController = {
  read(request, response, next, organisation_code) {
    const { view } = request.params
    const { __ } = response.locals

    const organisation = Organisation.read(
      organisation_code,
      request.session.data
    )
    response.locals.organisation = organisation

    const sections = ['contact', 'clinics', 'schools', 'sessions']
    response.locals.navigationItems = sections.map((item) => ({
      text: __(`organisation.${item}.title`),
      href: `${organisation.uri}/${item}`,
      current: view?.includes(item)
    }))

    next()
  },

  redirect(request, response, next) {
    const { organisation_code } = request.params

    response.redirect(`${organisation_code}/contact`)
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`organisation/${view}`)
  },

  readForm(request, response, next) {
    const { view } = request.params
    const { organisation } = response.locals

    const referrers = {
      contact: `${organisation.uri}/contact`,
      sessions: `${organisation.uri}/sessions`,
      password: `${organisation.uri}/sessions`
    }

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
    const { data } = request.session
    const { __, paths, organisation } = response.locals

    request.flash('success', __(`organisation.edit.success`))

    // Clean up session data
    delete data.organisation

    // Update session data
    organisation.update(request.body.organisation, data)

    response.redirect(paths.next)
  }
}
