import { fakerEN_GB as faker } from '@faker-js/faker'

import { SessionType } from '../enums.js'
import { Session } from '../models.js'
import { addDays, removeDays, setMidday, today } from '../utils/date.js'

/**
 * Generate fake session
 *
 * @param {import('../enums.js').SessionPreset} preset - Session preset
 * @param {import('../models.js').User} user - User
 * @param {number} academicYear - Academic year
 * @param {object} options - Options
 * @param {string} [options.clinic_id] - Clinic ID
 * @param {string} [options.school_id] - School URN
 * @returns {Session} Session
 */
export function generateSession(preset, academicYear, user, options) {
  // Don’t generate sessions for inactive session preset
  if (!preset.active) {
    return
  }

  let date = faker.date.between({
    from: removeDays(today(), 90),
    to: addDays(today(), 90)
  })

  date = setMidday(date)

  // Don’t create sessions during weekends
  if ([0, 6].includes(date.getDay())) {
    date = removeDays(date, 2)
  }

  return new Session({
    createdAt: removeDays(date, 60),
    createdBy_uid: user.uid,
    date,
    registration: true,
    academicYear,
    presetNames: [preset.name],
    type: SessionType.Clinic,
    clinic_id: options.clinic_id
  })
}
