import { fakerEN_GB as faker } from '@faker-js/faker'

import { Import, ImportStatus } from '../models/import.js'

/**
 * Generate fake import
 *
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {Array<string>|boolean|undefined} record_nhsns - Records
 * @param {import('../models/user.js').User} user - User
 * @param {import('../models/import.js').ImportType} [type] - Import type
 * @returns {Import} - Import
 */
export function generateImport(programme, record_nhsns, user, type) {
  const created = faker.date.recent({ days: 14, refDate: programme.start })

  let validations
  let status = ImportStatus.Complete

  if (record_nhsns === false) {
    // Simulate invalid file
    status = ImportStatus.Invalid
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

  return new Import({
    created,
    created_user_uid: user.uid,
    programme_pid: programme.pid,
    status,
    type,
    validations,
    record_nhsns,
    devoid: 99,
    invalid: 99
  })
}
