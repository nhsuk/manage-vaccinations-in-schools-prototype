import { wizard } from 'nhsuk-prototype-rig'
import xlsx from 'json-as-xlsx'
import { Download } from '../models/download.js'
import { Record } from '../models/record.js'
import { Vaccination } from '../models/vaccination.js'
import { UserRole } from '../models/user.js'

export const downloadController = {
  redirect(request, response) {
    const { pid } = request.params

    response.redirect(`/programmes/${pid}`)
  },

  new(request, response) {
    const { pid } = request.params
    const { data } = request.session

    // Delete previous data
    delete data.download
    delete data?.wizard?.download

    // Get vaccinations from programme
    const vaccinations = Object.values(data.vaccinations)
      .filter((vaccination) => vaccination.programme_pid === pid)
      .map((vaccination) => {
        vaccination = new Vaccination(vaccination)
        vaccination.record = new Record(
          data.patients[vaccination.patient_uuid].record
        )
        return vaccination
      })

    const download = new Download({
      programme_pid: pid,
      vaccinations,
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    data.wizard = { download }

    response.redirect(`${download.uri}/new/dates`)
  },

  update(request, response) {
    const { download } = request.app.locals

    // TODO: Support other file formats
    const { carePlus, fileName } = download
    const buffer = xlsx(carePlus, {
      fileName,
      writeOptions: {
        type: 'buffer',
        bookType: 'xlsx'
      }
    })

    response.header('Content-Type', 'application/octet-stream')
    response.header(
      'Content-disposition',
      `attachment; filename=${fileName}.xlsx`
    )

    response.end(buffer)
  },

  readForm(request, response, next) {
    const { download } = request.app.locals
    const { form, id } = request.params
    const { data } = request.session

    request.app.locals.download = new Download({
      ...(form === 'edit' && download), // Previous values
      ...data?.wizard?.download // Wizard values,
    })

    const journey = {
      [`/`]: {},
      [`/${id}/${form}/dates`]: {
        [`/${id}/${form}/format`]: () =>
          data.token?.role !== UserRole.DataConsumer
      },
      [`/${id}/${form}/providers`]: {},
      [`/${id}/${form}/format`]: {},
      [`/${id}/${form}/check-answers`]: {},
      [`/${id}`]: {}
    }

    response.locals.providerItems = Object.values(data.organisations).map(
      (organisation) => ({
        text: organisation.name,
        value: organisation.name
      })
    )

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' && {
        back: `${download.uri}/edit`,
        next: `${download.uri}/edit`
      })
    }

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`download/form/${view}`)
  },

  updateForm(request, response) {
    const { download } = request.app.locals
    const { data } = request.session
    const { paths } = response.locals

    data.wizard.download = new Download({
      ...download, // Previous values
      ...request.body.download // New value
    })

    response.redirect(paths.next)
  }
}
