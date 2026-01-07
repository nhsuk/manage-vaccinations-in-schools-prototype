import wizard from '@x-govuk/govuk-prototype-wizard'

import { UploadStatus, UploadType } from '../enums.js'
import { Upload } from '../models.js'
import { getDateValueDifference } from '../utils/date.js'
import { getResults, getPagination } from '../utils/pagination.js'
import { formatYearGroup } from '../utils/string.js'

export const uploadController = {
  read(request, response, next, upload_id) {
    response.locals.upload = Upload.findOne(upload_id, request.session.data)

    next()
  },

  readAll(request, response, next) {
    response.locals.uploads = Upload.findAll(request.session.data)

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`upload/${view}`)
  },

  list(request, response) {
    const { status, type } = request.query
    const { data } = request.session
    const { uploads } = response.locals

    let results = uploads

    // Filter by status
    if (status) {
      results = results.filter((upload) => upload.status === status)
    }

    // Filter by type
    if (type && type !== 'none') {
      results = results.filter((upload) => upload.type === type)
    }

    // Sort
    results = results.sort((a, b) =>
      getDateValueDifference(b.createdAt, a.createdAt)
    )

    // Results
    response.locals.results = getResults(results, request.query, 40)
    response.locals.pages = getPagination(results, request.query, 40)

    // Clean up session data
    delete data.status
    delete data.type

    response.render(`upload/list`)
  },

  filterList(request, response) {
    const params = new URLSearchParams()

    // Radios and text inputs
    for (const key of ['type']) {
      const value = request.body[key]
      if (value) {
        params.append(key, String(value))
      }
    }

    // Checkboxes
    for (const key of ['status']) {
      const value = request.body[key]
      const values = Array.isArray(value) ? value : [value]
      if (value) {
        values
          .filter((item) => item !== '_unchecked')
          .forEach((value) => {
            params.append(key, String(value))
          })
      }
    }

    response.redirect(`/uploads?${params}`)
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

    const upload = Upload.create(
      {
        createdBy_uid: account.uid,
        programme_id,
        type,
        status: UploadStatus.Processing,
        progress: 1,
        fileName: 'example.csv',
        ...(type === UploadType.School &&
          urn && {
            school_urn: urn
          })
      },
      data.wizard
    )

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

    // Update session data
    let upload = Upload.update(
      upload_id,
      data.wizard.uploads[upload_id],
      data.wizard
    )

    upload = Upload.create(upload, data)

    // Clean up session data
    delete data.upload
    delete data.wizard

    request.flash('success', __('upload.new.success'))

    response.redirect(referrer || upload.uri)
  },

  readForm(request, response, next) {
    const { upload_id } = request.params
    const { data } = request.session
    const { __ } = response.locals

    // Setup wizard if not already setup
    let upload = Upload.findOne(upload_id, data.wizard)
    if (!upload) {
      upload = Upload.create(response.locals.upload, data.wizard)
    }

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
            [`/${upload_id}/new/file`]: {}
          }
        : {
            [`/${upload_id}/new/school`]: {},
            [`/${upload_id}/new/year-groups`]: {},
            [`/${upload_id}/new/file`]: {}
          }),
      [`/${upload_id}`]: {}
    }

    // TODO: Use presenter
    upload = new Upload(upload, data)
    response.locals.upload = upload

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
    const { upload_id } = request.params
    const { data } = request.session
    const { paths } = response.locals

    Upload.update(upload_id, request.body.upload, data.wizard)

    response.redirect(paths.next)
  },

  delete(request, response) {
    const { upload_id } = request.params
    const { data } = request.session
    const { __ } = response.locals

    Upload.delete(upload_id, data)

    request.flash('success', __(`upload.delete.success`))

    response.redirect('/uploads')
  },

  approve(request, response) {
    const { account } = request.app.locals
    const { upload_id } = request.params
    const { data } = request.session
    const { __ } = response.locals

    Upload.update(
      upload_id,
      {
        updatedBy_uid: account.uid,
        status: UploadStatus.Approved
      },
      data
    )

    request.flash('success', __(`upload.approve.success`))

    response.redirect('/uploads')
  },

  removeRelationships(request, response) {
    const { __, upload } = response.locals

    request.flash('success', __('upload.removeRelationships.success'))

    response.redirect(upload.uri)
  }
}
