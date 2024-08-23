import { wizard } from 'nhsuk-prototype-rig'
import { Campaign } from '../models/campaign.js'
import { Cohort } from '../models/cohort.js'
import { Patient } from '../models/patient.js'
import { Record } from '../models/record.js'

export const cohortController = {
  redirect(request, response) {
    const { uid } = request.params

    response.redirect(`/campaigns/${uid}/cohort`)
  },

  new(request, response) {
    const { uid } = request.params
    const { data } = request.session

    // Get pending cohort from campaign
    const { pendingCohort } = new Campaign(data.campaigns[uid])

    // Remove 3 UUIDs from pending cohort…
    const records = pendingCohort.slice(0, -3)

    // …because we’ll say these are an inexact match
    const inexact = pendingCohort.slice(-3)

    // Add use 10 existing records as a placeholder for exact duplicates
    const exact = Object.values(data.records)
      .map((record) => record.nhsn)
      .slice(-10)

    // Delete previous data
    delete data.cohort
    delete data?.wizard?.cohort

    const cohort = new Cohort({
      campaign_uid: uid,
      records,
      inexact,
      exact,
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    data.wizard = { cohort }

    response.redirect(`${cohort.uri}/new/import`)
  },

  update(request, response) {
    const { campaign, cohort } = request.app.locals
    const { data } = request.session
    const { __n } = response.locals

    const updatedCohort = new Cohort({
      ...cohort, // Previous values
      ...data?.wizard?.cohort // Wizard values
    })

    // Create a new patient record
    for (const nhsn of updatedCohort.records) {
      const patient = new Patient({
        record: data.records[nhsn]
      })

      // Select patient for campaign
      patient.select = campaign

      // Add patient
      data.patients[patient.uuid] = patient
    }

    delete data?.wizard?.cohort

    request.flash(
      'success',
      __n('cohort.success.create', updatedCohort.records.length)
    )

    response.redirect(updatedCohort.uri)
  },

  readForm(request, response, next) {
    let { cohort } = request.app.locals
    const { form } = request.params
    const { data } = request.session

    cohort = new Cohort({
      ...(form === 'edit' && cohort), // Previous values
      ...data?.wizard?.cohort // Wizard values,
    })

    const journey = {
      [`/`]: {},
      [`/${form}/import`]: {},
      [`/${form}/check-answers`]: {},
      [`/`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request)
    }

    request.app.locals.cohort = cohort
    request.app.locals.records = cohort.records.map(
      (nhsn) => new Record(data.records[nhsn])
    )
    request.app.locals.inexact = cohort.inexact.map(
      (nhsn) => new Record(data.records[nhsn])
    )
    request.app.locals.exact = cohort.exact.map(
      (nhsn) => new Record(data.records[nhsn])
    )

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`cohort/form/${view}`)
  },

  updateForm(request, response) {
    const { cohort } = request.app.locals
    const { scenario } = request.body
    const { data } = request.session
    const { __, paths } = response.locals

    // Delete previous scenarios
    delete data.exact
    delete data.inexact

    let next
    switch (scenario) {
      case 'invalid':
        return response.render(`cohort/form/import`, {
          errors: {
            import: __('cohort.import.errors.invalid')
          }
        })
      case 'errors':
        next = `${cohort.uri}/new/errors`
        break
      case 'devoid':
        next = `${cohort.uri}/new/devoid`
        break
      default:
        next = paths.next
    }

    data.wizard.cohort = new Cohort({
      ...cohort, // Previous values
      ...request.body.cohort // New value
    })

    response.redirect(next)
  }
}
