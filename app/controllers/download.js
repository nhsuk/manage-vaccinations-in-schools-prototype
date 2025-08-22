import wizard from '@x-govuk/govuk-prototype-wizard'

import { UserRole } from '../enums.js'
import { Download } from '../models/download.js'
import { Organisation } from '../models/organisation.js'
import { Programme } from '../models/programme.js'
import { DownloadPresenter } from '../presenters/download.js'

export const downloadController = {
  readForm(request, response, next, download_id) {
    const { account } = request.app.locals
    const { data } = request.session

    const journey = {
      [`/`]: {},
      [`/${download_id}/new/dates`]: {
        [`/${download_id}/new/format`]: () =>
          account.role !== UserRole.DataConsumer
      },
      [`/${download_id}/new/organisations`]: {},
      [`/${download_id}/new/format`]: {},
      [`/${download_id}/new/check-answers`]: {},
      [`/${download_id}`]: {}
    }

    // Setup wizard if not already setup
    let download = Download.findOne(download_id, data, data.wizard)
    if (!download) {
      download = Download.create(response.locals.download, data.wizard)
    }

    response.locals.download = DownloadPresenter.forOne(download_id, data)

    response.locals.paths = wizard(journey, request)

    response.locals.organisationItems = Organisation.findAll(data).map(
      (organisation) => ({
        text: organisation.name,
        value: organisation.code
      })
    )

    next()
  },

  redirect(request, response) {
    const { programme_id } = request.params

    response.redirect(`/programmes/${programme_id}`)
  },

  new(request, response) {
    const { account } = request.app.locals
    const { programme_id } = request.params
    const { data } = request.session

    const programme = Programme.findOne(programme_id, data)
    const download = Download.create(
      {
        programme_id,
        vaccination_uuids: programme.vaccinations.map(({ uuid }) => uuid),
        createdBy_uid: account.uid
      },
      data.wizard
    )

    response.redirect(`${download.uri}/new/dates`)
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`download/form/${view}`)
  },

  updateForm(request, response) {
    const { download_id } = request.params
    const { data } = request.session
    const { paths } = response.locals

    Download.update(download_id, request.body.download, data.wizard)

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
