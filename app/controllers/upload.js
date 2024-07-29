import { wizard } from 'nhsuk-prototype-rig'
import { Campaign } from '../models/campaign.js'
import { Record } from '../models/record.js'
import { Upload } from '../models/upload.js'
import { Vaccination } from '../models/vaccination.js'

const getVaccinations = (data, uuids) => {
  const vaccinations = []
  for (const uuid of uuids) {
    const vaccination = new Vaccination(data.vaccinations[uuid])
    vaccination.record = new Record(data.records[vaccination.patient_nhsn])

    vaccinations.push(vaccination)
  }

  return vaccinations
}

export const uploadController = {
  redirect(request, response) {
    const { uid } = request.params

    response.redirect(`/campaigns/${uid}/uploads`)
  },

  list(request, response) {
    const { data } = request.session

    response.locals.uploads = Object.values(data.uploads).map(
      (upload) => new Upload(upload)
    )

    response.render('upload/list')
  },

  show(request, response) {
    response.render('upload/show')
  },

  read(request, response, next) {
    let { upload } = request.app.locals
    const { id } = request.params
    const { data } = request.session

    upload = new Upload(upload || data.uploads[id])
    const vaccinations = getVaccinations(data, upload.vaccinations)

    request.app.locals.upload = upload
    request.app.locals.vaccinations = vaccinations
    request.app.locals.inexact = vaccinations.slice(0, 3)

    next()
  },

  new(request, response) {
    const { uid } = request.params
    const { data } = request.session

    // Get pending upload from campaign
    const { pendingVaccinations } = new Campaign(data.campaigns[uid])

    // Delete previous data
    delete data.upload
    delete data.wizard

    const upload = new Upload({
      campaign_uid: uid,
      vaccinations: pendingVaccinations,
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    data.wizard = upload

    response.redirect(`${upload.uri}/new/import`)
  },

  update(request, response) {
    const { upload } = request.app.locals
    const { data } = request.session
    const { __ } = response.locals

    const updatedUpload = new Upload({
      ...upload, // Previous values
      ...data.wizard // Wizard values
    })

    // Add upload
    data.uploads[upload.id] = updatedUpload

    // Update CHIS records
    for (const uuid of upload.vaccinations) {
      const { patient_nhsn } = new Vaccination(data.vaccinations[uuid])
      data.records[patient_nhsn].vaccinations.push(uuid)
    }

    request.flash(
      'success',
      __('upload.success.create', updatedUpload.vaccinations.length)
    )

    response.redirect(updatedUpload.uri)
  },

  readForm(request, response, next) {
    const { upload } = request.app.locals
    const { form, id } = request.params
    const { data } = request.session

    request.app.locals.upload = new Upload({
      ...(form === 'edit' && upload), // Previous values
      ...data.wizard // Wizard values,
    })

    const journey = {
      [`/`]: {},
      [`/${id}/${form}/import`]: {},
      [`/${id}/${form}/check-answers`]: {},
      [`/${id}`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' && {
        back: `${upload.uri}/edit`,
        next: `${upload.uri}/edit`
      })
    }

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`upload/form/${view}`)
  },

  updateForm(request, response) {
    const { upload } = request.app.locals
    const { scenario } = request.body
    const { data } = request.session
    const { __, paths } = response.locals

    // Delete previous scenarios
    delete data.exact
    delete data.inexact
    delete data.incomplete

    let next
    switch (scenario) {
      case 'invalid':
        return response.render(`upload/form/import`, {
          errors: {
            import: __('upload.import.errors.invalid')
          }
        })
      case 'errors':
        next = `${upload.uri}/new/errors`
        break
      case 'devoid':
        next = `${upload.uri}/new/devoid`
        break
      case 'exact':
        next = `${upload.uri}/new/check-answers?exact=11`
        break
      case 'inexact':
        next = `${upload.uri}/new/check-answers?inexact=3`
        break
      case 'incomplete':
        next = `${upload.uri}/new/check-answers?incomplete=5`
        break
      default:
        next = paths.next
    }

    data.wizard = new Upload({
      ...upload, // Previous values
      ...request.body.upload // New value
    })

    response.redirect(next)
  }
}
