import { fakerEN_GB as faker } from '@faker-js/faker'

import { Instruction } from '../models/instruction.js'
import { removeDays } from '../utils/date.js'

/**
 * Generate fake instruction
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {import('../models/session.js').Session} session - Session
 * @param {Array<import('../models/user.js').User>} users - Users
 * @returns {Instruction} - Instruction
 */
export function generateInstruction(patientSession, programme, session, users) {
  const user = faker.helpers.arrayElement(users)

  return new Instruction({
    createdAt: removeDays(session.firstDate, 7),
    createdBy_uid: user.uid,
    programme_id: programme?.id,
    patientSession_uuid: patientSession.uuid
  })
}
