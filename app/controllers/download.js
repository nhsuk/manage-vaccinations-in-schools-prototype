import wizard from '@x-govuk/govuk-prototype-wizard'

import { Download } from '../models/download.js'
import { Organisation } from '../models/organisation.js'
import { Programme } from '../models/programme.js'
import { UserRole } from '../models/user.js'

export const downloadController = {
  readForm(request, response, next, download_id) {
    const { data } = request.session

    const journey = {
      [`/`]: {},
      [`/${download_id}/new/dates`]: {
        [`/${download_id}/new/format`]: () =>
          data.token?.role !== UserRole.DataConsumer
      },
      [`/${download_id}/new/organisations`]: {},
      [`/${download_id}/new/format`]: {},
      [`/${download_id}/new/check-answers`]: {},
      [`/${download_id}`]: {}
    }

    response.locals.download = new Download(
      Download.read(download_id, data?.wizard),
      data
    )

    response.locals.organisationItems = Organisation.readAll(data).map(
      (organisation) => ({
        text: organisation.name,
        value: organisation.code
      })
    )

    response.locals.paths = wizard(journey, request)

    next()
  },

  redirect(request, response) {
    const { pid } = request.params

    response.redirect(`/programmes/${pid}`)
  },

  new(request, response) {
    // TODO: Rename `pid` to `programme_pid`
    const { pid } = request.params
    const { data } = request.session

    const programme = Programme.read(pid, data)
    const download = new Download({
      programme_pid: pid,
      vaccination_uuids: programme.vaccinations.map(({ uuid }) => uuid),
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    download.create(download, data.wizard)

    response.redirect(`${download.uri}/new/dates`)
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
