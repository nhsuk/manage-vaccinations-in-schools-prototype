import { fakerEN_GB as faker } from '@faker-js/faker'

import { Instruction } from '../models.js'
import { removeDays } from '../utils/date.js'

/**
 * Generate fake instruction
 *
 * @param {import('../models.js').PatientSession} patientSession - Patient session
 * @param {import('../models.js').Programme} programme - Programme
 * @param {import('../models.js').Session} session - Session
 * @param {Array<import('../models.js').User>} users - Users
 * @returns {Instruction} Instruction
 */
export function generateInstruction(patientSession, programme, session, users) {
  const user = faker.helpers.arrayElement(users)

  return new Instruction({
    createdAt: removeDays(session.date, 7),
    createdBy_uid: user.uid,
    programme_id: programme?.id,
    patientSession_uuid: patientSession.uuid
  })
}
