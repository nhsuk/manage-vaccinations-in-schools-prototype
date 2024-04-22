import { wizard } from 'nhsuk-prototype-rig'
import { Campaign } from '../models/campaign.js'
import { Patient } from '../models/patient.js'
import { Record } from '../models/record.js'
import { Session } from '../models/session.js'

export const sessionController = {
  list(request, response) {
    const { data } = request.session

    response.render('sessions/list', {
      sessions: Object.values(data.sessions).map((session) => {
        session = new Session(session)
        session.cohort = Object.values(data.patients).filter(
          (patient) => patient.session_id === session.id
        )
        return session
      })
    })
  },

  show(request, response) {
    response.render('sessions/show')
  },

  activity(request, response) {
    const { patients } = request.app.locals
    const { activity } = request.params
    let { tab } = request.query
    const { __ } = response.locals

    let tabs = []
    switch (activity) {
      case 'consent':
        tab = tab || 'NoResponse'
        tabs = ['NoResponse', 'Given', 'Refused', 'Inconsistent']
        break
      case 'screen':
        tab = tab || 'NeedsTriage'
        tabs = ['NeedsTriage']
        break
    }

    const navigationItems = tabs.map((name) => ({
      text: __(`${activity}.${name}.label`),
      count: patients.filter((patient) => patient[activity]?.key === name)
        .length,
      href: `?tab=${name}`,
      current: name === tab
    }))

    response.render('sessions/activity', {
      activity,
      navigationItems,
      patients: patients.filter((patient) => patient[activity]?.key === tab),
      tab
    })
  },

  read(request, response, next) {
    const { id } = request.params
    const { data } = request.session

    request.app.locals.session = new Session(data.sessions[id])
    request.app.locals.patients = Object.values(data.patients)
      .filter((patient) => patient.session_id === id)
      .map((patient) => new Patient(patient))

    next()
  },

  edit(request, response) {
    const { session } = request.app.locals
    const { data } = request.session

    request.app.locals.session = new Session({
      ...session, // Previous values
      ...data.wizard // Wizard values
    })

    response.render('sessions/edit')
  },

  new(request, response) {
    const { data } = request.session

    // Delete previous data
    delete data.session
    delete data.wizard

    const session = new Session()

    data.wizard = session

    response.redirect(`/sessions/${session.id}/new/format`)
  },

  update(request, response) {
    const { session } = request.app.locals
    const { form, id } = request.params
    const { data } = request.session
    const { __ } = response.locals

    data.sessions[id] = new Session({
      ...session, // Previous values
      ...data.wizard, // Wizard values
      ...(data.token && { created_user_uuid: data.token.uuid })
    })

    delete data.wizard

    const action = form === 'edit' ? 'update' : 'create'
    request.flash('success', __(`session.success.${action}`, session.name))

    response.redirect(`/sessions/${id}`)
  },

  readForm(request, response, next) {
    const { session } = request.app.locals
    const { form, id } = request.params
    const { data } = request.session

    request.app.locals.session = new Session({
      ...(form === 'edit' && session), // Previous values
      ...data.wizard // Wizard values,
    })

    const journey = {
      [`/`]: {},
      [`/${id}/${form}/format`]: {},
      [`/${id}/${form}/campaign-uuid`]: {},
      [`/${id}/${form}/urn`]: {},
      [`/${id}/${form}/cohort`]: {},
      [`/${id}/${form}/date`]: {},
      [`/${id}/${form}/schedule`]: {},
      [`/${id}/${form}/check-answers`]: {},
      [`/${id}`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' && {
        back: `/sessions/${id}/edit`,
        next: `/sessions/${id}/edit`
      })
    }

    response.locals.campaignItems = Object.entries(data.campaigns).map(
      ([uuid, campaign]) => ({
        text: campaign.name,
        value: uuid
      })
    )

    response.locals.urnItems = Object.entries(data.schools).map(
      ([urn, school]) => ({
        text: school.name,
        value: urn
      })
    )

    if (request.app.locals.session.campaign_uuid) {
      const { campaign_uuid } = request.app.locals.session
      const campaign = new Campaign(data.campaigns[campaign_uuid])
      response.locals.cohortItems = campaign.cohort
        // Only show records where child is at the selected school
        .filter((nhsn) => {
          const record = data.records[nhsn]
          const { session } = request.app.locals
          return record.urn === Number(session.urn)
        })
        // Check records already assigned to session
        .map((nhsn) => {
          const record = new Record(data.records[nhsn])
          const patient = data.patients[record.nhsn]

          record.checked = patient.session_id === id

          return record
        })
    }

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`sessions/form/${view}`)
  },

  updateForm(request, response) {
    const { session } = request.app.locals
    const { data } = request.session
    const { paths } = response.locals

    data.wizard = new Session({
      ...session, // Previous values
      ...request.body.session // New value
    })

    response.redirect(paths.next)
  }
}
