import wizard from '@x-govuk/govuk-prototype-wizard'

import { Notice } from '../models/notice.js'
import { Record } from '../models/record.js'
import { School } from '../models/school.js'
import { Upload, UploadType } from '../models/upload.js'
import { getDateValueDifference } from '../utils/date.js'
import { formatYearGroup } from '../utils/string.js'

export const uploadController = {
  readAll(request, response, next) {
    const { data } = request.session

    let uploads = Upload.readAll(data)

    // Sort
    uploads = uploads.sort((a, b) =>
      getDateValueDifference(b.createdAt, a.createdAt)
    )

    response.locals.notices = Notice.readAll(data)
    response.locals.uploads = uploads
    response.locals.reviews = uploads.flatMap((upload) => upload.duplicate)

    next()
  },

  showAll(request, response) {
    const view = request.params.view || 'list'

    response.render(`upload/${view}`)
  },

  read(request, response, next) {
    const { id } = request.params
    const { data } = request.session

    response.locals.upload = Upload.read(id, data)

    next()
  },

  show(request, response) {
    response.render('upload/show')
  },

  new(request, response) {
    const { pid } = request.params
    const { type, urn } = request.query
    const { data } = request.session

    const upload = new Upload({
      programme_pid: pid,
      type,
      ...(type === UploadType.School &&
        urn && {
          school_urn: urn
        }),
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    upload.create(upload, data.wizard)

    // If type provided in query string, start journey at upload question
    data.startPath = type
      ? type === UploadType.School
        ? 'year-groups'
        : 'file'
      : 'type'

    response.redirect(`${upload.uri}/new/${data.startPath}`)
  },

  update(request, response) {
    const { id } = request.params
    const { data, referrer } = request.session
    const { __ } = response.locals

    const upload = new Upload(Upload.read(id, data.wizard), data)

    request.flash('success', __('upload.new.success'))

    // Clean up session data
    delete data.upload
    delete data.wizard

    // Update session data
    upload.update(upload, data)

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
            [`/${id}/${form}/type`]: {
              [`/${id}/${form}/file`]: {
                data: 'upload.type',
                excludedValue: UploadType.School
              }
            },
            [`/${id}/${form}/school`]: {},
            [`/${id}/${form}/year-groups`]: {},
            [`/${id}/${form}/file`]: {},
            [`/${id}/${form}/summary`]: {}
          }
        : {
            [`/${id}/${form}/school`]: {},
            [`/${id}/${form}/year-groups`]: {},
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

    response.locals.urnItems = Object.values(data.schools)
      .map((school) => new School(school))
      .map((school) => ({
        text: school.name,
        value: school.urn,
        ...(school.address && {
          attributes: {
            'data-hint': school.address.formatted.singleline
          }
        })
      }))

    if (upload.school) {
      response.locals.yearGroupItems = upload.school.yearGroups.map(
        (yearGroup) => ({
          text: formatYearGroup(yearGroup),
          value: yearGroup
        })
      )
    }

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
