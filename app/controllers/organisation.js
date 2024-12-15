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

    const organisation = Organisation.read(code, data)
    response.locals.organisation = organisation

    const sections = ['contact', 'clinics', 'schools', 'sessions']
    response.locals.navigationItems = sections.map((item) => ({
      text: __(`organisation.${item}.title`),
      href: `${organisation.uri}/${item}`,
      current: view.includes(item)
    }))

    next()
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

    organisation.update(request.body.organisation, data)

    // Clean up session data
    delete data.organisation

    response.redirect(paths.next)
  }
}
