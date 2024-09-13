import { Campaign } from '../models/campaign.js'
import { Patient } from '../models/patient.js'

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

  read(request, response, next) {
    const { uid } = request.params
    const { data } = request.session

    const campaign = new Campaign(data.campaigns[uid])

    request.app.locals.campaign = campaign
    request.app.locals.records = Object.values(data.patients)
      .filter((patient) => patient.campaign_uid === uid)
      .map((patient) => new Patient(patient))

    next()
  }
}
