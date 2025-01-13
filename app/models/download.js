import { fakerEN_GB as faker } from '@faker-js/faker'
import xlsx from 'json-as-xlsx'

import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  today
} from '../utils/date.js'
import { formatList } from '../utils/string.js'

import { Organisation } from './organisation.js'
import { Programme } from './programme.js'
import { Vaccination } from './vaccination.js'

/**
 * @readonly
 * @enum {string}
 */
export const DownloadFormat = {
  CSV: 'CSV',
  CarePlus: 'XLSX for CarePlus (System C)',
  SystmOne: 'XLSX for SystmOne (TPP)'
}

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
 * @property {string} [programme_pid] - Programme PID
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
    this.programme_pid = options?.programme_pid
    this.organisation_codes = options?.organisation_codes
    this.vaccination_uuids = options?.vaccination_uuids || []
  }

  /**
   * Get start date for `dateInput`
   *
   * @returns {object|undefined} - `dateInput` object
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
   * @returns {object|undefined} - `dateInput` object
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
   * Get name
   *
   * @returns {string} - Name
   */
  get name() {
    if (this.programme) {
      return this.programme.name
    }

    return 'Download'
  }

  /**
   * Get programme
   *
   * @returns {Programme} - Programme
   */
  get programme() {
    try {
      const programme = this.context?.programmes[this.programme_pid]
      if (programme) {
        return new Programme(programme)
      }
    } catch (error) {
      console.error('Download.programme', error.message)
    }
  }

  /**
   * Get organisations
   *
   * @returns {Array<Organisation>} - Organisations
   */
  get organisations() {
    if (this.context?.organisations && this.organisation_codes) {
      return this.organisation_codes
        .filter((code) => code !== '_unchecked')
        .map(
          (code) =>
            new Organisation(this.context?.organisations[code], this.context)
        )
    }

    return []
  }

  /**
   * Get vaccinations
   *
   * @returns {Array<Vaccination>} - Vaccinations
   */
  get vaccinations() {
    return this.vaccination_uuids.map((uuid) =>
      Vaccination.read(uuid, this.context)
    )
  }

  /**
   * Get CarePlus XLSX data
   *
   * @returns {Array} - XLSX data
   */
  get carePlus() {
    return [
      {
        sheet: 'Vaccinations',
        columns: [
          { label: 'NHSNumber', value: 'nhsn' },
          { label: 'Surname', value: 'lastName' },
          { label: 'Firstname', value: 'firstName' },
          {
            label: 'DateOfBirth',
            value: (row) =>
              formatDate(row.dob, {
                timeStyle: 'short'
              })
          },
          { label: 'Address_Line1', value: 'address_line1' },
          { label: 'PersonGivingConsent', value: 'parent' },
          { label: 'Ethnicity', value: 'ethnicity' },
          {
            label: 'DateAttended',
            value: (row) =>
              formatDate(row.date, {
                dateStyle: 'short'
              })
          },
          {
            label: 'TimeAttended',
            value: (row) =>
              formatDate(row.time, {
                timeStyle: 'short'
              })
          },
          { label: 'VenueType', value: 'location_type' },
          { label: 'VenueCode', value: 'location_urn' },
          { label: 'StaffType', value: 'user_role' },
          { label: 'StaffCode', value: 'user_code' },
          { label: 'Attended', value: 'attended' },
          { label: 'ReasonNOTAttended', value: 'non_attendance' },
          {
            label: 'SuspensionEndDate',
            value: (row) =>
              formatDate(row.batch_expiry, {
                timeStyle: 'short'
              })
          },
          { label: 'Vaccine1', value: 'vaccine_type' },
          { label: 'Dose1', value: 'sequence' },
          { label: 'ReasonNOTGiven1', value: 'refusal' },
          { label: 'Site1', value: 'site' },
          { label: 'Manufacture', value: 'vaccine_manufacturer' },
          { label: 'BatchNO1', value: 'batch_id' }
        ],
        content: this.vaccinations.map((vaccination) => ({
          nhsn: vaccination.patient?.nhsn,
          lastName: vaccination.patient?.lastName,
          firstName: vaccination.patient?.firstName,
          dob: vaccination.patient?.dob,
          address_line1: vaccination.patient?.address?.addressLine1,
          parent: vaccination.patient?.parent1?.fullName,
          ethnicity: '',
          date: vaccination.createdAt,
          time: vaccination.createdAt,
          location_type: 'SC',
          location_urn: vaccination.school_urn,
          user_role: '',
          user_code: '',
          attended: vaccination.given ? 'Y' : 'N',
          non_attendance: '',
          batch_expiry: vaccination.batch?.expiry,
          sequence: vaccination.sequence,
          refusal: !vaccination.given ? vaccination.outcome : '',
          batch_id: vaccination.batch_id,
          // FIX: Resolve Getters from Vaccination model
          site: vaccination.injectionSite,
          vaccine_type: vaccination.vaccine?.type,
          vaccine_manufacturer: vaccination.vaccine?.manufacturer
        }))
      }
    ]
  }

  /**
   * Get CSV definition
   *
   * @returns {string} - CSV data
   * @todo Use Mavis CSV export headers
   */
  get csv() {
    const headers = [
      'NHS_NUMBER',
      'PERSON_FORENAME',
      'PERSON_SURNAME',
      'PERSON_DOB',
      'PERSON_GENDER_CODE',
      'PERSON_POSTCODE',
      'SCHOOL_NAME',
      'SCHOOL_URN',
      'REASON_NOT_VACCINATED',
      'DATE_OF_VACCINATION',
      'VACCINE_GIVEN',
      'BATCH_NUMBER',
      'BATCH_EXPIRY_DATE',
      'ANATOMICAL_SITE',
      'VACCINATED',
      'PERFORMING_PROFESSIONAL'
    ]
    const rows = this.vaccinations.map((vaccination) =>
      headers
        .map((header) => {
          const value = {
            NHS_NUMBER: vaccination.patient?.nhsn,
            PERSON_FORENAME: vaccination.patient?.firstName,
            PERSON_SURNAME: vaccination.patient?.lastName,
            PERSON_DOB: vaccination.patient?.dob,
            PERSON_GENDER_CODE: vaccination.patient?.gender,
            PERSON_POSTCODE: vaccination.patient?.postalCode,
            SCHOOL_NAME: vaccination.location,
            SCHOOL_URN: vaccination.school_urn,
            REASON_NOT_VACCINATED: !vaccination.given
              ? vaccination.outcome
              : '',
            DATE_OF_VACCINATION: vaccination.createdAt,
            VACCINE_GIVEN: vaccination.vaccine?.brand,
            BATCH_NUMBER: vaccination.batch_id,
            BATCH_EXPIRY_DATE: vaccination.batch?.expiry,
            ANATOMICAL_SITE: vaccination.injectionSite,
            VACCINATED: vaccination.given ? 'Y' : 'N',
            PERFORMING_PROFESSIONAL: vaccination.createdBy?.fullName
          }[header]

          return `"${(value || '').toString().replace(/"/g, '""')}"`
        })
        .join(',')
    )

    return [headers.join(','), ...rows].join('\n')
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      startAt: this.startAt
        ? formatDate(this.startAt, { dateStyle: 'long' })
        : 'Earliest recorded vaccination',
      endAt: this.endAt
        ? formatDate(this.endAt, { dateStyle: 'long' })
        : 'Latest recorded vaccination',
      organisations:
        this.organisations.length > 0
          ? formatList(this.organisations.map(({ name }) => name))
          : this.organisations.length,
      vaccinations: `${this.vaccinations.length} records`
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'download'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/programmes/${this.programme_pid}/download/${this.id}`
  }

  /**
   * Read
   *
   * @param {string} id - Download ID
   * @param {object} context - Context
   * @returns {Download|undefined} Download
   * @static
   */
  static read(id, context) {
    if (context?.downloads) {
      return new Download(context.downloads[id], context)
    }
  }

  /**
   * Create
   *
   * @param {Download} download - Download
   * @param {object} context - Context
   */
  create(download, context) {
    download = new Download(download)

    // Update context
    context.downloads = context.downloads || {}
    context.downloads[download.id] = download
  }

  /**
   * Update
   *
   * @param {object} updates - Updates
   * @param {object} context - Context
   */
  update(updates, context) {
    this.updatedAt = new Date()

    // Remove download context
    delete this.context

    // Delete original download (with previous ID)
    delete context.downloads[this.id]

    // Update context
    const updatedDownload = Object.assign(this, updates)
    context.downloads[updatedDownload.id] = updatedDownload
  }

  /**
   * Create file
   *
   * @param {object} context - Context
   * @returns {object} - File buffer, name and mime type
   */
  createFile(context) {
    const { name } = new Download(this, context)

    let buffer
    let extension
    let mimetype
    switch (this.format) {
      case DownloadFormat.CarePlus:
        buffer = xlsx(this.carePlus, { name, writeOptions: { type: 'buffer' } })
        extension = 'xlsx'
        mimetype = 'application/octet-stream'
        break
      default:
        buffer = Buffer.from(this.csv)
        extension = 'csv'
        mimetype = 'text/csv'
    }

    return { buffer, fileName: `${name}.${extension}`, mimetype }
  }
}
