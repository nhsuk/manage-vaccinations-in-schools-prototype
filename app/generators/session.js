import { fakerEN_GB as faker } from '@faker-js/faker'

import schoolTerms from '../datasets/school-terms.js'
import { OrganisationDefaults, ProgrammePreset, SessionType } from '../enums.js'
import { Session } from '../models/session.js'
import { addDays, removeDays, setMidday } from '../utils/date.js'

/**
 * Generate fake session
 *
 * @param {string} programmePreset - Programme preset
 * @param {import('../models/user.js').User} user - User
 * @param {number} academicYear - Academic year
 * @param {object} options - Options
 * @param {string} [options.clinic_id] - Clinic ID
 * @param {string} [options.school_urn] - School URN
 * @returns {Session} Session
 */
export function generateSession(programmePreset, academicYear, user, options) {
  // Get programme preset
  const preset = ProgrammePreset[programmePreset]

  // Don’t generate sessions for inactive programme presets
  if (!preset.active) {
    return
  }

  const { clinic_id, school_urn } = options
  const term = schoolTerms[academicYear][preset.term]

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

    openAt = removeDays(date, OrganisationDefaults.SessionOpenWeeks * 7)
  }

  return new Session({
    createdAt: removeDays(term.from, 60),
    createdBy_uid: user.uid,
    date,
    openAt,
    registration: true,
    academicYear,
    programmePreset,
    ...(clinic_id && { type: SessionType.Clinic, clinic_id }),
    ...(school_urn && { type: SessionType.School, school_urn })
  })
}
