import wizard from '@x-govuk/govuk-prototype-wizard'

import { Download } from '../models/download.js'
import { Organisation } from '../models/organisation.js'
import { Programme } from '../models/programme.js'
import { UserRole } from '../models/user.js'

export const downloadController = {
  redirect(request, response) {
    const { pid } = request.params

    response.redirect(`/programmes/${pid}`)
  },

  new(request, response) {
    const { pid } = request.params
    const { data } = request.session

    const programme = Programme.read(pid, data)
    const download = new Download({
      programme_pid: pid,
      vaccination_uuids: programme.vaccinations.map(({ uuid }) => uuid),
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    download.create(download, data.wizard)

    response.redirect(`${download.uri}/new/dates`)
  },

  readForm(request, response, next) {
    const { form, id } = request.params
    const { data } = request.session
    const { download } = response.locals

    const journey = {
      [`/`]: {},
      [`/${id}/${form}/dates`]: {
        [`/${id}/${form}/format`]: () =>
          data.token?.role !== UserRole.DataConsumer
      },
      [`/${id}/${form}/organisations`]: {},
      [`/${id}/${form}/format`]: {},
      [`/${id}/${form}/check-answers`]: {},
      [`/${id}`]: {}
    }

    response.locals.download = new Download(
      Download.read(id, data?.wizard),
      data
    )

    response.locals.organisationItems = Organisation.readAll(data).map(
      (organisation) => ({
        text: organisation.name,
        value: organisation.code
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
    const { data } = request.session
    const { paths, download } = response.locals

    download.update(request.body.download, data.wizard)

    response.redirect(paths.next)
  },

  downloadFile(request, response) {
    const { data } = request.session
    const { download } = response.locals

    const { buffer, fileName, mimetype } = download.createFile(data)

    response.header('Content-Type', mimetype)
    response.header('Content-disposition', `attachment; filename=${fileName}`)

    response.end(buffer)
  }
}
