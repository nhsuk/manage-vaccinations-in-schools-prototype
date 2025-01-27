import { fakerEN_GB as faker } from '@faker-js/faker'

import { Upload, UploadStatus } from '../models/upload.js'
import { today } from '../utils/date.js'

/**
 * Generate fake upload
 *
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {Array<string>|boolean|undefined} record_nhsns - Records
 * @param {import('../models/user.js').User} user - User
 * @param {import('../models/upload.js').UploadType} [type] - Upload type
 * @returns {Upload} - Upload
 */
export function generateUpload(programme, record_nhsns, user, type) {
  const createdAt = faker.date.recent({ days: 14, refDate: today() })

  let validations
  let status = UploadStatus.Complete

  if (record_nhsns === false) {
    // Simulate invalid file
    status = UploadStatus.Invalid
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

  return new Upload({
    createdAt,
    createdBy_uid: user.uid,
    programme_pid: programme.pid,
    status,
    type,
    validations,
    record_nhsns,
    devoid: 99,
    invalid: 99
  })
}
