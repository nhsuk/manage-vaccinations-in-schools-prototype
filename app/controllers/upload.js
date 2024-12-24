import wizard from '@x-govuk/govuk-prototype-wizard'

import { Record } from '../models/record.js'
import { Upload, UploadType } from '../models/upload.js'
import { formatList } from '../utils/string.js'

export const uploadController = {
  redirect(request, response) {
    const { pid } = request.params

    response.redirect(`/programmes/${pid}/uploads`)
  },

  read(request, response, next) {
    let { upload } = request.app.locals
    const { id } = request.params
    const { data } = request.session
    const { __n } = response.locals

    upload = new Upload(data.uploads[id] || upload, data)

    // Count and show duplicate records
    const duplicates = upload.records.filter(
      (record) => record.hasPendingChanges
    )
    upload.duplicate = duplicates.length

    // Count incomplete records (those missing an NHS number)
    upload.incomplete = upload.records.filter(
      (record) => record.hasMissingNhsNumber
    ).length

    // Issues to show in warning callout
    const issues = []
    for (const type of ['devoid', 'invalid', 'incomplete']) {
      if (upload[type]) {
        issues.push(__n(`upload.${type}.count`, upload[type]))
      }
    }

    response.locals.upload = upload

    request.app.locals.upload = upload
    request.app.locals.duplicates = duplicates
    request.app.locals.issues = formatList(issues)

    next()
  },

  show(request, response) {
    response.render('upload/show')
  },

  new(request, response) {
    const { pid } = request.params
    const { type } = request.query
    const { data } = request.session

    // If type provided in query string, start journey at upload question
    const startPath = type ? 'file' : 'type'
    request.app.locals.startPath = startPath

    // Delete previous data
    delete data.upload
    delete data?.wizard?.upload

    const upload = new Upload({
      programme_pid: pid,
      type,
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    data.wizard = { upload }

    response.redirect(`${upload.uri}/new/${startPath}`)
  },

  readForm(request, response, next) {
    const { upload, startPath } = request.app.locals
    const { form, id } = request.params
    const { data } = request.session
    const { __ } = response.locals

    request.app.locals.upload = new Upload({
      ...(form === 'edit' && upload), // Previous values
      ...data?.wizard?.upload // Wizard values,
    })

    const journey = {
      [`/`]: {},
      ...(startPath === 'type'
        ? {
            [`/${id}/${form}/type`]: {},
            [`/${id}/${form}/file`]: {}
          }
        : {
            [`/${id}/${form}/file`]: {}
          }),
      [`/${id}`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' && {
        back: `${upload.uri}/edit`,
        next: `${upload.uri}/edit`
      })
    }

    response.locals.typeItems = Object.entries(UploadType).map(
      ([key, value]) => ({
        text: UploadType[key],
        hint: { text: __(`upload.type.hint.${key}`) },
        value
      })
    )

    response.locals.upload = request.app.locals.upload

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`upload/form/${view}`)
  },

  updateForm(request, response) {
    const { upload } = request.app.locals
    const { view } = request.params
    const { data } = request.session
    const { paths } = response.locals
    const { __ } = response.locals

    const updatedUpload = new Upload({
      ...upload, // Previous values
      ...request.body.upload // New value
    })

    data.wizard.upload = updatedUpload

    // No check answers screen; perform update on last page of wizard flow
    if (view === 'file') {
      // Add upload
      data.uploads[upload.id] = updatedUpload

      // Clean up
      delete data?.wizard?.upload

      request.flash('success', __('upload.new.success'))

      response.redirect(updatedUpload.uri)
    } else {
      response.redirect(paths.next)
    }
  },

  readReview(request, response, next) {
    const { upload } = request.app.locals
    const { nhsn } = request.params
    const { data, referrer } = request.session

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

  showReview(request, response) {
    response.render('upload/review')
  },

  updateReview(request, response) {
    const { decision } = request.body
    const { __, back } = response.locals

    // Doesn’t change any values, but shows a confirmation message
    if (decision === 'duplicate') {
      request.flash('success', __('upload.review.success'))
    }

    response.redirect(back)
  }
}
