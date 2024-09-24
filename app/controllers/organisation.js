import { Organisation } from '../models/organisation.js'

export const organisationController = {
  read(request, response, next) {
    const { code } = request.params
    const { data } = request.session

    request.app.locals.organisation = new Organisation(data.organisations[code])

    next()
  },

  edit(request, response) {
    const { organisation } = request.app.locals
    const { data } = request.session

    request.app.locals.organisation = new Organisation({
      ...organisation, // Previous values
      ...data?.wizard?.organisation // Wizard values
    })

    response.render('organisation/edit')
  },

  update(request, response) {
    const { organisation } = request.app.locals
    const { data } = request.session
    const { __ } = response.locals

    const updatedOrganisation = new Organisation(
      Object.assign(
        organisation, // Previous values
        data?.wizard?.organisation, // Wizard values
        request.body.organisation // New values
      )
    )

    data.organisations[updatedOrganisation.code] = updatedOrganisation

    // Clean up
    delete data?.wizard?.organisation

    request.flash('success', __(`organisation.success.update`))

    response.redirect(`${updatedOrganisation.uri}/edit`)
  },

  readForm(request, response, next) {
    const { organisation } = request.app.locals
    const { form } = request.params
    const { data } = request.session

    request.app.locals.organisation = new Organisation({
      ...organisation,
      ...(form === 'edit' && organisation), // Previous values
      ...data?.wizard?.organisation // Wizard values
    })

    response.locals.paths = {
      ...(form === 'edit' && {
        back: `${organisation.uri}/edit`,
        next: `${organisation.uri}/edit`
      })
    }

    next()
  },

  showForm(request, response) {
    let { view } = request.params

    response.render(`organisation/form/${view}`)
  },

  updateForm(request, response) {
    const { organisation } = request.app.locals
    const { data } = request.session
    const { paths } = response.locals

    data.wizard.organisation = new Organisation(
      Object.assign(
        organisation, // Previous values
        request.body.organisation // New value
      )
    )

    response.redirect(paths.next)
  }
}
