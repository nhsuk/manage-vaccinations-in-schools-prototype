import { wizard } from 'nhsuk-prototype-rig'
import { Campaign } from '../models/campaign.js'
import { Session } from '../models/session.js'
import { Vaccine } from '../models/vaccine.js'

export const campaignController = {
  list(request, response) {
    const { data } = request.session

    response.render('campaigns/list', {
      campaigns: Object.values(data.campaigns).map(
        (campaign) => new Campaign(campaign)
      )
    })
  },

  show(request, response) {
    response.render('campaigns/show')
  },

  reports(request, response) {
    response.render('campaigns/reports')
  },

  read(request, response, next) {
    const { uuid } = request.params
    const { data } = request.session

    const campaign = new Campaign(data.campaigns[uuid])

    request.app.locals.campaign = campaign
    request.app.locals.sessions = Object.values(data.sessions)
      .filter((session) => session.campaign_uuid === uuid)
      .map((session) => {
        session = new Session(session)
        session.cohort = Object.values(data.patients).filter(
          (patient) => patient.session_id === session.id
        )
        return session
      })

    next()
  },

  edit(request, response) {
    const { campaign } = request.app.locals
    const { data } = request.session

    request.app.locals.campaign = new Campaign({
      ...campaign, // Previous values
      ...data.wizard // Wizard values
    })

    response.render('campaigns/edit')
  },

  new(request, response) {
    const { data } = request.session

    // Delete previous data
    delete data.campaign
    delete data.wizard

    const campaign = new Campaign()

    data.wizard = campaign

    response.redirect(`/campaigns/${campaign.uuid}/new/details`)
  },

  update(request, response) {
    const { campaign } = request.app.locals
    const { form, uuid } = request.params
    const { data } = request.session
    const { __ } = response.locals

    const updatedCampaign = new Campaign({
      ...campaign, // Previous values
      ...data.wizard, // Wizard values
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    data.campaigns[uuid] = updatedCampaign

    delete data.wizard

    const action = form === 'edit' ? 'update' : 'create'
    request.flash(
      'success',
      __(`campaign.success.${action}`, { campaign: updatedCampaign })
    )

    response.redirect(`/campaigns/${uuid}`)
  },

  readForm(request, response, next) {
    const { campaign } = request.app.locals
    const { form, uuid } = request.params
    const { data } = request.session

    request.app.locals.campaign = new Campaign({
      ...(form === 'edit' && campaign), // Previous values
      ...data.wizard // Wizard values,
    })

    const journey = {
      [`/`]: {},
      [`/${uuid}/${form}/details`]: {},
      [`/${uuid}/${form}/period`]: {},
      [`/${uuid}/${form}/vaccines`]: {},
      [`/${uuid}/${form}/check-answers`]: {},
      [`/${uuid}`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' && {
        back: `/campaigns/${uuid}/edit`,
        next: `/campaigns/${uuid}/edit`
      })
    }

    response.locals.vaccineItems = Object.values(data.vaccines)
      .map((vaccine) => new Vaccine(vaccine))
      .map((vaccine) => ({
        text: vaccine.brandWithName,
        value: vaccine.gtin
      }))

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`campaigns/form/${view}`)
  },

  updateForm(request, response) {
    const { campaign } = request.app.locals
    const { data } = request.session
    const { paths } = response.locals

    data.wizard = new Campaign({
      ...campaign, // Previous values
      ...request.body.campaign // New value
    })

    response.redirect(paths.next)
  }
}
