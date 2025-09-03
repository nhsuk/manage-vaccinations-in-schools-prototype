import { fakerEN_GB as faker } from '@faker-js/faker'
import prototypeFilters from '@x-govuk/govuk-prototype-filters'

import { UploadStatus, UploadType } from '../enums.js'
import { Upload } from '../models/upload.js'
import { today } from '../utils/date.js'

/**
 * Generate fake upload
 *
 * @param {Array<string>} patient_uuids - Patients
 * @param {import('../models/user.js').User} user - User
 * @param {import('../enums.js').UploadType} [type] - Upload type
 * @param {import('../models/school.js').School} [school] - School
 * @returns {Upload} Upload
 */
export function generateUpload(
  patient_uuids,
  user,
  type = UploadType.Cohort,
  school
) {
  const createdAt = faker.date.recent({ days: 14, refDate: today() })
  const fileName = `${prototypeFilters.slugify(type)}-${faker.number.int(5)}.csv`

  const status = faker.helpers.weightedArrayElement([
    { value: UploadStatus.Processing, weight: 1 },
    { value: UploadStatus.Devoid, weight: 1 },
    { value: UploadStatus.Invalid, weight: 1 },
    { value: UploadStatus.Failed, weight: 1 },
    { value: UploadStatus.Review, weight: 10 },
    { value: UploadStatus.Approved, weight: 8 }
  ])

  // Processing upload
  let progress
  if (status === UploadStatus.Processing) {
    progress = faker.number.int({ min: 1, max: 100 })
  }

  // Devoid upload
  if (status === UploadStatus.Devoid) {
    patient_uuids = []
  }

  // Invalid upload
  let validations
  if (status === UploadStatus.Invalid) {
    validations = {
      3: {
        CHILD_FIRST_NAME: 'is required but missing',
        CHILD_POSTCODE: '‘24 High Street’ should be a postcode, like SW1A 1AA',
        CHILD_NHS_NUMBER:
          '‘QQ 12 34 56 A’ should be a valid NHS number, like 485 777 3456'
      },
      8: {
        CHILD_DOB: '‘Simon’ should be formatted as YYYY-MM-DD'
      }
    }
  }

  // Approved upload
  let updatedAt
  let updatedBy_uid
  if (status === UploadStatus.Approved) {
    updatedAt = new Date(createdAt.getTime() + 72 * 60000)
    updatedBy_uid = user.uid
  }

  return new Upload({
    createdAt,
    createdBy_uid: user.uid,
    updatedAt,
    updatedBy_uid,
    fileName,
    status,
    type,
    progress,
    validations,
    patient_uuids,
    ...(school && {
      yearGroups: school.yearGroups,
      school_urn: school.urn
    })
  })
}
