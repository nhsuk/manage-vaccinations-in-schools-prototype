import { en } from '../locales/en.js'
import { Download } from '../models/download.js'
import { formatDate } from '../utils/date.js'
import { getSummaryRow } from '../utils/presenter.js'
import { formatList } from '../utils/string.js'

/**
 * @class DownloadPresenter
 * @param {Download} download - Download
 */
export class DownloadPresenter {
  #download
  #context

  constructor(download, context) {
    this.#download = download
    this.#context = context

    this.format = download.format
    this.uri = download.uri
  }

  /**
   * Present download
   *
   * @param {string} id - Download UID
   * @param {object} context - Global context
   * @param {object} [wizard] - Wizard context
   * @returns {DownloadPresenter|undefined} User
   * @static
   */
  static forOne(id, context, wizard) {
    const download = Download.findOne(id, context, wizard)

    return new DownloadPresenter(download, context)
  }

  /**
   * Get name
   *
   * @returns {string} Name
   */
  get name() {
    if (this.#download.programme) {
      return this.#download.programme.name
    }

    return 'Download'
  }

  /**
   * Get formatted start date
   *
   * @returns {string} Formatted start date
   */
  get startAt() {
    return this.#download.startAt
      ? formatDate(this.#download.startAt, { dateStyle: 'long' })
      : 'Earliest recorded vaccination'
  }

  /**
   * Get formatted end date
   *
   * @returns {string} Formatted start date
   */
  get endAt() {
    return this.#download.endAt
      ? formatDate(this.#download.endAt, { dateStyle: 'long' })
      : 'Latest recorded vaccination'
  }

  /**
   * Get organisation list
   *
   * @returns {string} Organisation list
   */
  get organisations() {
    return this.#download.organisations.length > 0
      ? formatList(this.#download.organisations.map(({ name }) => name))
      : null
  }

  /**
   * Get record count
   *
   * @returns {string} Record count
   */
  get records() {
    return `${this.#download.vaccinations.length} records`
  }

  /**
   * Get CarePlus XLSX data
   *
   * @returns {Array} XLSX data
   */
  get carePlus() {
    console.log('vaccinations', this.#download.vaccinations)

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
        content: this.#download.vaccinations.map((vaccination) => ({
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
   * @returns {string} CSV data
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
    const rows = this.#download.vaccinations.map((vaccination) =>
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
   * Get summary rows for display in templates
   *
   * @param {object} fields - Fields to include
   * @returns {Array} Summary rows
   */
  getSummaryRows(fields = {}) {
    const rows = []

    for (const fieldName of Object.keys(fields)) {
      if (fields[fieldName]) {
        rows.push(
          getSummaryRow({
            key: en.download[fieldName].label,
            value: this[fieldName] || this.#download[fieldName],
            actions: [{ href: fields[fieldName].href }]
          })
        )
      }
    }

    rows.at(-1).classes = 'nhsuk-summary-list__row--no-border'

    return rows
  }
}
