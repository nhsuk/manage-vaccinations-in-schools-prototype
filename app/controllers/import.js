import { wizard } from 'nhsuk-prototype-rig'

import { Import, ImportType } from '../models/import.js'
import { Record } from '../models/record.js'
import { Vaccination } from '../models/vaccination.js'
import { formatList } from '../utils/string.js'

export const importController = {
  redirect(request, response) {
    const { pid } = request.params

    response.redirect(`/programmes/${pid}/imports`)
  },

  read(request, response, next) {
    let { _import } = request.app.locals
    const { id } = request.params
    const { data } = request.session
    const { __n } = response.locals

    _import = new Import(data.imports[id] || _import)

    const records = _import.records.map((record) => {
      record = new Record(record)
      // TODO: Review multiple vaccination programmes in a single import
      record.vaccination = new Vaccination(record.vaccinations[0])
      return record
    })

    _import.records = records

    // Count and show duplicate records
    const duplicates = records.filter((record) => record.hasPendingChanges)
    _import.duplicate = duplicates.length

    // Count incomplete records (those missing an NHS number)
    _import.incomplete = records.filter(
      (record) => record.hasMissingNhsNumber
    ).length

    // Issues to show in warning callout
    const issues = []
    for (const type of ['devoid', 'invalid', 'incomplete']) {
      if (_import[type]) {
        issues.push(__n(`import.${type}.count`, _import[type]))
      }
    }

    response.locals.import = _import

    request.app.locals._import = _import
    request.app.locals.duplicates = duplicates
    request.app.locals.issues = formatList(issues)

    next()
  },

  show(request, response) {
    response.render('import/show')
  },

  new(request, response) {
    const { pid } = request.params
    const { type } = request.query
    const { data } = request.session

    // If type provided in query string, start journey at import question
    const startPath = type ? 'file' : 'type'
    request.app.locals.startPath = startPath

    // Delete previous data
    delete data._import
    delete data?.wizard?._import

    const _import = new Import({
      programme_pid: pid,
      type,
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    data.wizard = { _import }

    response.redirect(`${_import.uri}/new/${startPath}`)
  },

  readForm(request, response, next) {
    const { _import, startPath } = request.app.locals
    const { form, id } = request.params
    const { data } = request.session
    const { __ } = response.locals

    request.app.locals._import = new Import({
      ...(form === 'edit' && _import), // Previous values
      ...data?.wizard?._import // Wizard values,
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
        back: `${_import.uri}/edit`,
        next: `${_import.uri}/edit`
      })
    }

    response.locals.typeItems = Object.entries(ImportType).map(
      ([key, value]) => ({
        text: ImportType[key],
        hint: { text: __(`import.type.hint.${key}`) },
        value
      })
    )

    response.locals.import = request.app.locals._import

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`import/form/${view}`)
  },

  updateForm(request, response) {
    const { _import } = request.app.locals
    const { view } = request.params
    const { data } = request.session
    const { paths } = response.locals
    const { __ } = response.locals

    const updatedImport = new Import({
      ..._import, // Previous values
      ...request.body._import // New value
    })

    data.wizard._import = updatedImport

    // No check answers screen; perform update on last page of wizard flow
    if (view === 'file') {
      // Add import
      data.imports[_import.id] = updatedImport

      // Clean up
      delete data?.wizard?._import

      request.flash('success', __('import.success.create'))

      response.redirect(updatedImport.uri)
    } else {
      response.redirect(paths.next)
    }
  },

  readReview(request, response, next) {
    const { back, _import } = request.app.locals
    const { nhsn } = request.params
    const { referrer } = request.query

    const record = _import.records.find((record) => record.nhsn === nhsn)

    response.locals.back = referrer || back || _import.uri
    response.locals.record = new Record(record)
    response.locals.duplicateRecord = new Record({
      ...record,
      ...record.pendingChanges
    })

    next()
  },

  showReview(request, response) {
    response.render('import/review')
  },

  updateReview(request, response) {
    const { decision } = request.body
    const { __, back } = response.locals

    // Doesn’t change any values, but shows a confirmation message
    if (decision === 'duplicate') {
      request.flash('success', __('import.success.update'))
    }

    response.redirect(back)
  }
}
