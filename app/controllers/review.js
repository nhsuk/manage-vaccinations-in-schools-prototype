import { Notice } from '../models/notice.js'
import { Record } from '../models/record.js'
import { Upload } from '../models/upload.js'

export const reviewController = {
  read(request, response, next, upload_id) {
    const { nhsn } = request.params
    const { data, referrer } = request.session

    const upload = Upload.read(upload_id, request.session.data)
    const record = upload.records.find((record) => record.nhsn === nhsn)

    // Show back link to referring page, else upload page
    response.locals.back = referrer || upload.uri

    response.locals.record = new Record(record, data)

    response.locals.duplicateRecord = new Record(
      {
        ...record,
        ...record?.pendingChanges
      },
      data
    )

    next()
  },

  readAll(request, response, next) {
    const { data } = request.session
    const uploads = Upload.readAll(data)

    // Required to show number of notices in upload section navigation
    response.locals.notices = Notice.readAll(data)

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
    response.render('review/show')
  },

  list(request, response) {
    response.render('review/list')
  },

  update(request, response) {
    const { decision } = request.body
    const { __, back } = response.locals

    // Doesn’t change any values, but shows a confirmation message
    if (decision === 'duplicate') {
      request.flash('success', __('upload.review.success'))
    }

    response.redirect(back)
  }
}
