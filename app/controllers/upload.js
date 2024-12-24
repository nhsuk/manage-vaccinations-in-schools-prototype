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
    const { id } = request.params
    const { data } = request.session
    const { __n } = response.locals

    const upload = Upload.read(id, data)

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
    response.locals.duplicates = duplicates
    response.locals.issues = formatList(issues)

    next()
  },

  show(request, response) {
    response.render('upload/show')
  },

  new(request, response) {
    const { pid } = request.params
    const { type } = request.query
    const { data } = request.session

    const upload = new Upload({
      programme_pid: pid,
      type,
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    upload.create(upload, data.wizard)

    // If type provided in query string, start journey at upload question
    data.startPath = type ? 'file' : 'type'

    response.redirect(`${upload.uri}/new/${data.startPath}`)
  },

  update(request, response) {
    const { id } = request.params
    const { data, referrer } = request.session
    const { __ } = response.locals

    const upload = new Upload(Upload.read(id, data.wizard), data)

    upload.update(upload, data)

    // Clean up session data
    delete data.upload
    delete data.wizard

    request.flash('success', __('upload.new.success'))

    response.redirect(referrer || upload.uri)
  },

  readForm(request, response, next) {
    const { form, id } = request.params
    const { data } = request.session
    let { __, upload } = response.locals

    // Setup wizard if not already setup
    if (!Upload.read(id, data.wizard)) {
      upload.create(upload, data.wizard)
    }

    upload = new Upload(Upload.read(id, data.wizard), data)
    response.locals.upload = upload

    const journey = {
      [`/`]: {},
      ...(data.startPath === 'type'
        ? {
            [`/${id}/${form}/type`]: {},
            [`/${id}/${form}/file`]: {},
            [`/${id}/${form}/summary`]: {}
          }
        : {
            [`/${id}/${form}/file`]: {},
            [`/${id}/${form}/summary`]: {}
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

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`upload/form/${view}`)
  },

  updateForm(request, response) {
    const { data } = request.session
    const { paths, upload } = response.locals

    upload.update(request.body.upload, data.wizard)

    response.redirect(paths.next)
  },

  readReview(request, response, next) {
    const { nhsn } = request.params
    const { data, referrer } = request.session
    const { upload } = response.locals

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
