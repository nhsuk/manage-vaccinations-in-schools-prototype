import { Campaign } from '../models/campaign.js'
import { Session } from '../models/session.js'
import { Vaccine } from '../models/vaccine.js'

export const campaignController = {
  list(request, response) {
    const { data } = request.session

    response.render('campaigns/list', {
      campaigns: Object.values(data.campaigns).map((campaign) => {
        campaign = new Campaign(campaign)
        campaign.vaccines = campaign.vaccines.map(
          (vaccine) => new Vaccine(data.vaccines[vaccine]).brandWithName
        )
        return campaign
      })
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
    request.app.locals.vaccines = campaign.vaccines.map(
      (vaccine) => new Vaccine(data.vaccines[vaccine]).brandWithName
    )

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
  }
}
