import { wizard } from 'nhsuk-prototype-rig'
import { Import, ImportType } from '../models/import.js'
import { Patient } from '../models/patient.js'
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
      record.vaccination =
        record.vaccinations.length && _import.type === ImportType.Report
          ? new Vaccination(record.vaccinations[0])
          : false
      return record
    })

    _import.records = records

    // Count and show duplicate records
    const duplicates = records.filter((record) => record.hasPendingChanges)
    _import.duplicate = duplicates.length

    // Count incomplete records (those missing an NHS number)
    _import.incomplete = records.filter(
      (record) => record.missingNhsNumber
    ).length

    // Issues to show in warning callout
    const issues = []
    for (const type of ['devoid', 'invalid', 'incomplete']) {
      if (_import[type]) {
        issues.push(__n(`import.${type}.count`, _import[type]))
      }
    }

    request.app.locals.import = _import
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
      devoid: 4, // Mock 4 devoid records being excluded
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    data.wizard = { _import }

    response.redirect(`${_import.uri}/new/${startPath}`)
  },

  update(request, response) {
    const { _import, programme } = request.app.locals
    const { data } = request.session
    const { __ } = response.locals

    const updatedImport = new Import({
      ..._import, // Previous values
      ...data?.wizard?._import // Wizard values
    })

    // Add import
    data.imports[_import.id] = updatedImport

    // Process imported records
    for (let record of _import.records) {
      record = new Record(record)

      if (_import.type === ImportType.Cohort) {
        // Mark child record as no longer pending
        data.records[record.nhsn]._pending = false

        // Select patient for cohort
        const patient = new Patient({ record })
        const cohort = programme.cohorts.find((cohort) => {
          return cohort.yearGroup === record.yearGroup
        })
        patient.select = cohort

        // Add patient to programme cohort
        cohort.records.push(record.nhsn)

        // Add patient to system
        data.patients[patient.uuid] = patient
      }

      if (_import.type === ImportType.Report) {
        // Mark vaccination record as no longer pending
        const vaccination = record.vaccinations[0]
        data.vaccinations[vaccination.uuid]._pending = false

        // Update CHIS record
        data.records[record.nhsn].vaccinations.push(vaccination.uuid)
      }
    }

    // Clean up
    delete data?.wizard?._import

    request.flash(
      'success',
      __('import.success.create', updatedImport.records.length)
    )

    response.redirect(updatedImport.uri)
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
            [`/${id}/${form}/file`]: {},
            [`/${id}/${form}/check-answers`]: {}
          }
        : {
            [`/${id}/${form}/file`]: {},
            [`/${id}/${form}/check-answers`]: {}
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

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`import/form/${view}`)
  },

  updateForm(request, response) {
    const { _import, programme } = request.app.locals
    const { scenario } = request.body
    const { data } = request.session
    const { __, paths } = response.locals

    // Get pending records for this programme
    const nhsns = programme.records.map((record) => record.nhsn)
    const pendingRecords = Object.values(data.records)
      .filter((record) => nhsns.includes(record.nhsn))
      .filter((record) => record._pending)

    // Get pending vaccinations for this programme
    const pendingVaccinations = Object.values(data.vaccinations)
      .filter((vaccination) => vaccination.programme_pid === programme.pid)
      .filter((vaccination) => vaccination._pending)

    // Only upload vaccinations that have been given
    const pendingGivenVaccinations = pendingVaccinations
      .filter((vaccination) => !vaccination.given)
      .map((vaccination) => {
        // Convert vaccination record into a child record
        let { record } = data.patients[vaccination.patient_uuid]
        record.vaccinations = [vaccination]

        return record
      })

    // Count invalid records (records for vaccinations that were not given)
    _import.invalid =
      pendingVaccinations.length - pendingGivenVaccinations.length

    switch (_import.type) {
      case ImportType.Cohort:
        _import.records = pendingRecords
        break
      case ImportType.Report:
        _import.records = pendingGivenVaccinations
        break
      default:
        _import.records = []
    }

    let next
    switch (scenario) {
      case 'invalid':
        return response.render(`import/form/file`, {
          errors: {
            import: __('import.file.errors.invalid')
          }
        })
      case 'errors':
        next = `${_import.uri}/new/errors`
        break
      default:
        next = paths.next
    }

    // No new records to upload
    if (_import.records.length === 0) {
      next = `${_import.uri}/new/devoid`
    }

    data.wizard._import = new Import({
      ..._import, // Previous values
      ...request.body._import // New value
    })

    response.redirect(next)
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
      ...record._pendingChanges
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
