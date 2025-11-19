import { Download } from '../models/download.js'
import { Organisation } from '../models/organisation.js'
import { Programme } from '../models/programme.js'

export const downloadController = {
  redirect(request, response) {
    const { programme_id } = request.params

    response.redirect(`/reports/${programme_id}`)
  },

  form(request, response) {
    const { programme_id } = request.params
    const { data } = request.session

    const programme = Programme.findOne(programme_id, data)

    response.locals.programme = programme
    response.locals.organisationItems = Organisation.findAll(data).map(
      (organisation) => ({
        text: organisation.name,
        value: organisation.code
      })
    )
    response.locals.paths = {
      back: `/reports/${programme_id}`,
      next: `/reports/${programme_id}/download/new`
    }

    response.render('download/form')
  },

  create(request, response) {
    const { programme_id } = request.params
    const { account } = request.app.locals
    const { data } = request.session

    const programme = Programme.findOne(programme_id, data)

    // Create download record
    const createdDownload = Download.create(
      {
        ...request.body.download,
        programme_id,
        vaccination_uuids: programme.vaccinations.map(({ uuid }) => uuid),
        createdBy_uid: account.uid
      },
      data
    )

    // Create Download instance with full context to access vaccinations
    const download = new Download(createdDownload, data)

    // Generate and return file
    const { buffer, fileName, mimetype } = download.createFile(data)

    response.header('Content-Type', mimetype)
    response.header('Content-disposition', `attachment; filename=${fileName}`)

    response.end(buffer)
  }
}
