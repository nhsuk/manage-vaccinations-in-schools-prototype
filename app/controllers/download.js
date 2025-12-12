import programmesData from '../datasets/programmes.js'
import { AcademicYear, DownloadFormat, ProgrammeType } from '../enums.js'
import { Download } from '../models/download.js'
import { Organisation } from '../models/organisation.js'
import { Programme } from '../models/programme.js'

export const downloadController = {
  form(request, response) {
    const { data } = request.session

    const academicYearKeys = Object.keys(AcademicYear)
    const mostRecentYear = academicYearKeys[academicYearKeys.length - 1]

    response.locals.academicYearItems = Object.entries(AcademicYear).map(
      ([value, text]) => ({
        text,
        value,
        checked: value === mostRecentYear
      })
    )

    response.locals.programmeTypeItems = Object.entries(ProgrammeType).map(
      ([value, text]) => ({
        text,
        value,
        checked: value === ProgrammeType.Flu
      })
    )

    response.locals.download = {
      format: DownloadFormat.CSV
    }

    response.locals.organisationItems = Organisation.findAll(data).map(
      (organisation) => ({
        text: organisation.name,
        value: organisation.code
      })
    )
    response.locals.paths = {
      back: '/reports',
      next: '/reports/download/new'
    }

    response.render('download/form')
  },

  create(request, response) {
    const { account } = request.app.locals
    const { data } = request.session

    const { type } = request.body.download
    const programme_id = programmesData[type].id
    const programme = Programme.findOne(programme_id, data)

    const createdDownload = Download.create(
      {
        ...request.body.download,
        programme_id,
        vaccination_uuids: programme.vaccinations.map(({ uuid }) => uuid),
        createdBy_uid: account.uid
      },
      data
    )

    const download = new Download(createdDownload, data)

    // Generate and return file
    const { buffer, fileName, mimetype } = download.createFile(data)

    response.header('Content-Type', mimetype)
    response.header('Content-disposition', `attachment; filename=${fileName}`)

    response.end(buffer)
  }
}
