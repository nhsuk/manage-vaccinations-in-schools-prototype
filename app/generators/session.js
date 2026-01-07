import { fakerEN_GB as faker } from '@faker-js/faker'

import { SessionType, TeamDefaults } from '../enums.js'
import { Session } from '../models.js'
import { addDays, getTermDates, removeDays, setMidday } from '../utils/date.js'
import { getSessionYearGroups } from '../utils/session.js'

/**
 * Generate fake session
 *
 * @param {import('../enums.js').SessionPreset} preset - Session preset
 * @param {import('../models.js').User} user - User
 * @param {number} academicYear - Academic year
 * @param {object} options - Options
 * @param {string} [options.clinic_id] - Clinic ID
 * @param {string} [options.school_urn] - School URN
 * @returns {Session} Session
 */
export function generateSession(preset, academicYear, user, options) {
  // Don’t generate sessions for inactive session preset
  if (!preset.active) {
    return
  }

  const { clinic_id, school_urn } = options
  const term = getTermDates(academicYear, preset.term)

  let date = faker.date.between({
    from: term.from,
    to: term.to
  })

  let openAt
  if (date) {
    // Clinic sessions happen after the school term has finished
    if (clinic_id) {
      date = faker.date.between({
        from: term.to,
        to: addDays(term.to, 30)
      })
    }

    date = setMidday(date)

    // Don’t create sessions during weekends
    if ([0, 6].includes(date.getDay())) {
      date = removeDays(date, 2)
    }

    openAt = removeDays(date, TeamDefaults.SessionOpenWeeks * 7)
  }

  let yearGroups
  if (options.school_urn) {
    yearGroups = getSessionYearGroups(options.school_urn, [preset])
  }

  return new Session({
    createdAt: removeDays(term.from, 60),
    createdBy_uid: user.uid,
    date,
    openAt,
    registration: true,
    academicYear,
    presetNames: [preset.name],
    ...(clinic_id && { type: SessionType.Clinic, clinic_id }),
    ...(school_urn && { type: SessionType.School, school_urn, yearGroups })
  })
}
