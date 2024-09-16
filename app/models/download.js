import { fakerEN_GB as faker } from '@faker-js/faker'
import { VaccinationSequence } from '../models/vaccination.js'
import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  getToday
} from '../utils/date.js'
import { getEnumKeyAndValue } from '../utils/enum.js'
import { formatList } from '../utils/string.js'

export class DownloadFormat {
  static CSV = 'CSV'
  static CarePlus = 'XLSX for CarePlus (System C)'
  static SystmOne = 'XLSX for SystmOne (TPP)'
}

/**
 * @class Vaccination report download
 * @property {string} id - Download ID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created download
 * @property {string} [programme_pid] - Programme ID
 * @property {Array<string>} [vaccinations] - Vaccination UUIDs
 * @property {Array<string>} [providers] - Vaccination UUIDs
 * @property {DownloadFormat} [format] - Downloaded file format
 * @property {string} [fileName] - Downloaded file name
 * @function ns - Namespace
 * @function uri - URL
 */
export class Download {
  constructor(options) {
    this.id = options?.id || faker.string.hexadecimal({ length: 8, prefix: '' })
    this.created = options?.created || getToday().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.programme_pid = options?.programme_pid
    this.vaccinations = options?.vaccinations || []
    this.providers = options?.providers
    this.from = options?.from
    this.until = options?.until
    this.format = options?.format || DownloadFormat.CSV
    this.fileName = options?.fileName || 'download'
    // dateInput objects
    this.from_ = options?.from_
    this.until_ = options?.until_
  }

  get from_() {
    return convertIsoDateToObject(this.from)
  }

  set from_(object) {
    if (object) {
      this.from = convertObjectToIsoDate(object)
    }
  }

  get until_() {
    return convertIsoDateToObject(this.until)
  }

  set until_(object) {
    if (object) {
      this.until = convertObjectToIsoDate(object)
    }
  }

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
              formatDate(row.batch_expires, {
                timeStyle: 'short'
              })
          },
          { label: 'Vaccine1', value: 'vaccine_type' },
          {
            label: 'Dose1',
            value: (row) =>
              getEnumKeyAndValue(VaccinationSequence, row.sequence).key
          },
          { label: 'ReasonNOTGiven1', value: 'refusal' },
          { label: 'Site1', value: 'site' },
          { label: 'Manufacture', value: 'vaccine_manufacturer' },
          { label: 'BatchNO1', value: 'batch_id' }
        ],
        content: this.vaccinations.map((vaccination) => ({
          nhsn: vaccination.record.nhsn,
          lastName: vaccination.record.lastName,
          firstName: vaccination.record.firstName,
          dob: vaccination.record.dob,
          address_line1: vaccination.record.address.addressLine1,
          parent: vaccination.record.parent.fullName,
          ethnicity: '',
          date: vaccination.created,
          time: vaccination.created,
          location_type: 'SC',
          location_urn: vaccination.urn,
          user_role: '',
          user_code: '',
          attended: vaccination.given ? 'Y' : 'N',
          non_attendance: '',
          batch_expires: vaccination.batch_expires,
          sequence: vaccination.sequence,
          refusal: !vaccination.given ? vaccination.outcome : '',
          batch_id: vaccination.batch_id,
          // FIX: Resolve Getters from Vaccination model
          site: vaccination.site,
          vaccine_type: vaccination.vaccine?.type,
          vaccine_manufacturer: vaccination.vaccine?.manufacturer
        }))
      }
    ]
  }

  get formatted() {
    return {
      from: this.from
        ? formatDate(this.from, { dateStyle: 'long' })
        : 'Earliest recorded vaccination',
      until: this.until
        ? formatDate(this.until, { dateStyle: 'long' })
        : 'Latest recorded vaccination',
      providers: formatList(this.providers),
      vaccinations: `${this.vaccinations.length} records`
    }
  }

  get ns() {
    return 'download'
  }

  get uri() {
    return `/programmes/${this.programme_pid}/download/${this.id}`
  }
}
