import { Organisation } from '../models/organisation.js'
import { OrganisationPresenter } from '../presenters/organisation.js'

export const organisationController = {
  read(request, response, next, organisation_code) {
    const { view } = request.params
    const { __ } = response.locals

    const organisation = OrganisationPresenter.forOne(
      organisation_code,
      request.session.data
    )
    response.locals.organisation = organisation

    response.locals.navigationItems = [
      'contact',
      'clinics',
      'schools',
      'sessions'
    ].map((item) => ({
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
    const { organisation_code } = request.params
    const { data } = request.session
    const { __, paths } = response.locals

    // Clean up session data
    delete data.organisation

    // Update session data
    Organisation.update(organisation_code, request.body.organisation, data)

    request.flash('success', __(`organisation.edit.success`))

    response.redirect(paths.next)
  }
}
