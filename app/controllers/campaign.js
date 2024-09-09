import { wizard } from 'nhsuk-prototype-rig'
import { Campaign } from '../models/campaign.js'
import { Cohort } from '../models/cohort.js'
import { Patient } from '../models/patient.js'
import { Record } from '../models/record.js'
import { Session } from '../models/session.js'
import { Vaccine } from '../models/vaccine.js'
import { Upload } from '../models/upload.js'
import { getVaccinations } from '../utils/vaccination.js'

export const campaignController = {
  list(request, response) {
    const { data } = request.session

    response.render('campaigns/list', {
      campaigns: Object.values(data.campaigns).map(
        (campaign) => new Campaign(campaign)
      )
    })
  },

  cohort(request, response) {
    response.render('campaigns/cohorts')
  },

  reviews(request, response) {
    response.render('campaigns/reviews')
  },

  sessions(request, response) {
    response.render('campaigns/sessions')
  },

  uploads(request, response) {
    const { uid } = request.params
    const { data } = request.session

    response.locals.uploads = Object.values(data.uploads)
      .filter((upload) => upload.campaign_uid === uid)
      .map((upload) => new Upload(upload))

    response.render('campaigns/uploads')
  },

  vaccinations(request, response) {
    response.render('campaigns/vaccinations')
  },

  show(request, response) {
    response.render('campaigns/show')
  },

  read(request, response, next) {
    const { uid } = request.params
    const { data } = request.session

    const campaign = new Campaign(data.campaigns[uid])

    request.app.locals.campaign = campaign
    request.app.locals.cohort = Object.values(data.patients)
      .filter((patient) => patient.campaign_uid === uid)
      .map((patient) => new Patient(patient))
    request.app.locals.sessions = Object.values(data.sessions)
      .filter((session) => session.campaign_uid === uid)
      .map((session) => {
        session = new Session(session)
        session.cohort = Object.values(data.patients).filter(
          (patient) => patient.session_id === session.id
        )
        return session
      })

    const uuids = []
    if (data.features.uploads.on) {
      const uploads = Object.values(data.uploads).filter(
        (upload) => upload.campaign_uid === uid
      )

      for (const upload of uploads) {
        for (const uuid of upload.vaccinations) {
          uuids.push(uuid)
        }
      }

      // If upload has occurred, fake issues with 3 uploaded records
      request.app.locals.reviews = getVaccinations(data, uuids.slice(0, 3))
    } else {
      Object.values(data.vaccinations)
        .filter((vaccination) => vaccination.campaign_uid === uid)
        .forEach((vaccination) => uuids.push(vaccination.uuid))
    }

    const vaccinations = getVaccinations(data, uuids)

    request.app.locals.vaccinations = vaccinations
    request.app.locals.missingNhsNumber = vaccinations.filter(
      (vaccination) => vaccination.record.missingNhsNumber
    )

    // Remove any back state that have been stored
    delete request.app.locals.back

    next()
  },

  edit(request, response) {
    const { campaign } = request.app.locals
    const { data } = request.session.data

    request.app.locals.campaign = new Campaign({
      ...campaign, // Previous values
      ...data?.wizard?.campaign // Wizard values
    })

    response.render('campaigns/edit')
  },

  new(request, response) {
    const { data } = request.session

    // Delete previous data
    delete data.campaign
    delete data?.wizard?.campaign

    const campaign = new Campaign()

    data.wizard = { campaign }

    response.redirect(`${campaign.uri}/new/details`)
  },

  update(request, response) {
    const { campaign } = request.app.locals
    const { form, uid } = request.params
    const { data } = request.session
    const { __ } = response.locals

    const updatedCampaign = new Campaign({
      ...campaign, // Previous values
      ...data?.wizard?.campaign, // Wizard values
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    // Create a pending cohort
    const records = Object.values(data.records).map(
      (record) => new Record(record)
    )
    const cohort = Cohort.generate(campaign, records, data.token)

    // Add pending cohort to campaign
    updatedCampaign.pendingCohort = cohort.records

    data.campaigns[uid] = updatedCampaign

    delete data?.wizard?.campaign

    const action = form === 'edit' ? 'update' : 'create'
    request.flash(
      'success',
      __(`campaign.success.${action}`, { campaign: updatedCampaign })
    )

    response.redirect(updatedCampaign.uri)
  },

  readForm(request, response, next) {
    const { campaign } = request.app.locals
    const { form, uid } = request.params
    const { data } = request.session

    request.app.locals.campaign = new Campaign({
      ...(form === 'edit' && campaign), // Previous values
      ...data?.wizard?.campaign // Wizard values,
    })

    const journey = {
      [`/`]: {},
      [`/${uid}/${form}/details`]: {},
      [`/${uid}/${form}/vaccines`]: {},
      [`/${uid}/${form}/check-answers`]: {},
      [`/${uid}`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' && {
        back: `${campaign.uri}/edit`,
        next: `${campaign.uri}/edit`
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

    data.wizard.campaign = new Campaign({
      ...campaign, // Previous values
      ...request.body.campaign // New value
    })

    response.redirect(paths.next)
  }
}
