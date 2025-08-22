import { fakerEN_GB as faker } from '@faker-js/faker'
import xlsx from 'json-as-xlsx'

import { DownloadFormat } from '../enums.js'
import { DownloadPresenter } from '../presenters/download.js'
import { OrganisationPresenter } from '../presenters/organisation.js'
import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  today
} from '../utils/date.js'
import { stringToArray } from '../utils/string.js'

import { Programme } from './programme.js'
import { Vaccination } from './vaccination.js'

/**
 * @class Vaccination report download
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} id - Download ID
 * @property {Date} [createdAt] - Created date
 * @property {string} [createdBy_uid] - User who created download
 * @property {Date} [updatedAt] - Updated date
 * @property {Date} [startAt] - Date to start report
 * @property {object} [startAt_] - Date to start report from (from `dateInput`)
 * @property {Date} [endAt] - Date to end report
 * @property {object} [endAt_] - Date to end report (from `dateInput`)
 * @property {DownloadFormat} [format] - Downloaded file format
 * @property {string} [programme_id] - Programme ID
 * @property {Array<string>} [organisation_codes] - Organisation ODC codes
 * @property {Array<string>} [vaccination_uuids] - Vaccination UUIDs
 */
export class Download {
  constructor(options, context) {
    this.context = context
    this.id = options?.id || faker.string.hexadecimal({ length: 8, prefix: '' })
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdBy_uid = options?.createdBy_uid
    this.updatedAt = options?.updatedAt && new Date(options.updatedAt)
    this.startAt = options?.startAt && new Date(options.startAt)
    this.startAt_ = options?.startAt_
    this.endAt = options?.endAt && new Date(options.endAt)
    this.endAt_ = options?.endAt_
    this.format = options?.format || DownloadFormat.CSV
    this.programme_id = options?.programme_id
    this.organisation_codes = stringToArray(options?.organisation_codes)
    this.vaccination_uuids = options?.vaccination_uuids || []
  }

  /**
   * Get start date for `dateInput`
   *
   * @returns {object|undefined} `dateInput` object
   */
  get startAt_() {
    return convertIsoDateToObject(this.startAt)
  }

  /**
   * Set start date from `dateInput`
   *
   * @param {object} object - dateInput object
   */
  set startAt_(object) {
    if (object) {
      this.startAt = convertObjectToIsoDate(object)
    }
  }

  /**
   * Get end date for `dateInput`
   *
   * @returns {object|undefined} `dateInput` object
   */
  get endAt_() {
    return convertIsoDateToObject(this.endAt)
  }

  /**
   * Set end date from `dateInput`
   *
   * @param {object} object - dateInput object
   */
  set endAt_(object) {
    if (object) {
      this.endAt = convertObjectToIsoDate(object)
    }
  }

  /**
   * Get programme
   *
   * @returns {Programme} Programme
   */
  get programme() {
    return Programme.findOne(this.programme_id, this.context)
  }

  /**
   * Get organisations
   *
   * @returns {Array<OrganisationPresenter>} Organisations
   */
  get organisations() {
    return this.organisation_codes.map((code) =>
      OrganisationPresenter.forOne(code, this.context)
    )
  }

  /**
   * Get vaccinations
   *
   * @returns {Array<Vaccination>} Vaccinations
   */
  get vaccinations() {
    return this.vaccination_uuids.map((uuid) =>
      Vaccination.findOne(uuid, this.context)
    )
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/programmes/${this.programme_id}/download/${this.id}`
  }

  /**
   * Find one
   *
   * @param {string} id - Download ID
   * @param {object} context - Global context
   * @param {object} [wizard] - Wizard context
   * @returns {Download|undefined} Download
   * @static
   */
  static findOne(id, context, wizard) {
    const download = wizard ? wizard?.downloads?.[id] : context?.downloads?.[id]

    if (download) {
      return new Download(download, context)
    }
  }

  /**
   * Create
   *
   * @param {object} download - Download
   * @param {object} context - Context
   * @returns {Download} Created download
   * @static
   */
  static create(download, context) {
    const createdDownload = new Download(download)

    // Update context
    context.downloads = context.downloads || {}
    context.downloads[createdDownload.id] = createdDownload

    return createdDownload
  }

  /**
   * Update
   *
   * @param {string} id - Download ID
   * @param {object} updates - Updates
   * @param {object} context - Context
   * @returns {Download} Updated download
   * @static
   */
  static update(id, updates, context) {
    const updatedDownload = Object.assign(
      Download.findOne(id, context),
      updates
    )
    updatedDownload.updatedAt = today()

    // Remove download context
    delete updatedDownload.context

    // Delete original download (with previous ID)
    delete context.downloads[id]

    // Update context
    context.downloads[updatedDownload.id] = updatedDownload

    return updatedDownload
  }

  /**
   * Create file
   *
   * @param {object} context - Context
   * @returns {object} File buffer, name and mime type
   */
  createFile(context) {
    const { name, carePlus, csv } = new DownloadPresenter(this, context)

    let buffer
    let extension
    let mimetype
    switch (this.format) {
      case DownloadFormat.CarePlus:
        // @ts-ignore
        buffer = xlsx(carePlus, { name, writeOptions: { type: 'buffer' } })
        extension = 'xlsx'
        mimetype = 'application/octet-stream'
        break
      default:
        buffer = Buffer.from(csv)
        extension = 'csv'
        mimetype = 'text/csv'
    }

    return { buffer, fileName: `${name}.${extension}`, mimetype }
  }
}
