import wizard from '@x-govuk/govuk-prototype-wizard'

import { UploadType } from '../enums.js'
import { Notice } from '../models/notice.js'
import { Upload } from '../models/upload.js'
import { getDateValueDifference } from '../utils/date.js'
import { formatYearGroup } from '../utils/string.js'

export const uploadController = {
  read(request, response, next, upload_id) {
    response.locals.upload = Upload.findOne(upload_id, request.session.data)

    next()
  },

  readAll(request, response, next) {
    const { data } = request.session
    let uploads = Upload.findAll(data)

    uploads = uploads.sort((a, b) =>
      getDateValueDifference(b.createdAt, a.createdAt)
    )

    response.locals.uploads = uploads

    // Required to show number of notices in upload section navigation
    response.locals.notices = Notice.findAll(data).filter(
      ({ archivedAt }) => !archivedAt
    )

    // Required to show number of reviews in upload section navigation
    response.locals.reviews = uploads.flatMap((upload) => upload.duplicates)

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`upload/${view}`)
  },

  list(request, response) {
    response.render(`upload/list`)
  },

  action(type) {
    return (request, response) => {
      const { upload } = response.locals
      let paths

      if (type === 'bulk remove relationships') {
        paths = { back: `${upload.uri}/bulk-remove-relationships` }
      }

      response.render('upload/action', { paths, type })
    }
  },

  new(request, response) {
    const { account } = request.app.locals
    const { programme_id } = request.params
    const { type, urn } = request.query
    const { data } = request.session

    const upload = new Upload({
      programme_id,
      type,
      createdBy_uid: account.uid,
      ...(type === UploadType.School &&
        urn && {
          school_urn: urn
        })
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
    const { upload_id } = request.params
    const { data, referrer } = request.session
    const { __ } = response.locals

    const upload = new Upload(Upload.findOne(upload_id, data.wizard), data)

    request.flash('success', __('upload.new.success'))

    // Clean up session data
    delete data.upload
    delete data.wizard

    // Update session data
    upload.update(upload, data)

    response.redirect(referrer || upload.uri)
  },

  readForm(request, response, next) {
    const { upload_id } = request.params
    const { data } = request.session
    let { __, upload } = response.locals

    // Setup wizard if not already setup
    if (!Upload.findOne(upload_id, data.wizard)) {
      upload.create(upload, data.wizard)
    }

    upload = new Upload(Upload.findOne(upload_id, data.wizard), data)
    response.locals.upload = upload

    const journey = {
      [`/`]: {},
      ...(data.startPath === 'type'
        ? {
            [`/${upload_id}/new/type`]: {
              [`/${upload_id}/new/file`]: {
                data: 'upload.type',
                excludedValue: UploadType.School
              }
            },
            [`/${upload_id}/new/school`]: {},
            [`/${upload_id}/new/year-groups`]: {},
            [`/${upload_id}/new/file`]: {},
            [`/${upload_id}/new/summary`]: {}
          }
        : {
            [`/${upload_id}/new/school`]: {},
            [`/${upload_id}/new/year-groups`]: {},
            [`/${upload_id}/new/file`]: {},
            [`/${upload_id}/new/summary`]: {}
          }),
      [`/${upload_id}`]: {}
    }

    response.locals.paths = wizard(journey, request)

    response.locals.typeItems = Object.entries(UploadType).map(
      ([key, value]) => ({
        text: UploadType[key],
        hint: { text: __(`upload.type.hint.${key}`) },
        value
      })
    )

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

  removeRelationships(request, response) {
    const { __, upload } = response.locals

    request.flash('success', __('upload.removeRelationships.success'))

    response.redirect(upload.uri)
  }
}
