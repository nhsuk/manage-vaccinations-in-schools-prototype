import { Notice } from '../models/notice.js'
import { Patient } from '../models/patient.js'
import { Upload } from '../models/upload.js'

export const reviewController = {
  read(request, response, next, upload_id) {
    const { nhsn } = request.params
    const { data, referrer } = request.session

    const upload = Upload.findOne(upload_id, request.session.data)
    const patient = upload.patients.find((patient) => patient.nhsn === nhsn)

    // Show back link to referring page, else upload page
    response.locals.back = referrer || upload.uri

    response.locals.patient = new Patient(patient, data)

    response.locals.duplicatePatient = new Patient(
      {
        ...patient,
        ...patient?.pendingChanges
      },
      data
    )

    next()
  },

  readAll(request, response, next) {
    const { data } = request.session
    const uploads = Upload.findAll(data)

    // Required to show number of notices in upload section navigation
    response.locals.notices = Notice.findAll(data)

    response.locals.reviews = uploads.flatMap((upload) => upload.duplicates)

    response.locals.pendingReviews = {}
    for (const upload of uploads) {
      if (upload.duplicates?.length > 0) {
        response.locals.pendingReviews[upload.id] = upload.duplicates
      }
    }

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`review/${view}`)
  },

  list(request, response) {
    response.render('review/list')
  },

  update(request, response) {
    const { decision } = request.body
    const { __, back } = response.locals

    // Doesn’t change any values, but shows a confirmation message
    if (decision === 'duplicate') {
      request.flash('success', __('review.duplicate.success'))
    }

    // Doesn’t change any values, but shows a confirmation message
    if (decision === 'restore') {
      request.flash('success', __('review.archived.success'))
    }

    response.redirect(back)
  }
}
