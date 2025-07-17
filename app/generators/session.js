import { fakerEN_GB as faker } from '@faker-js/faker'

import schoolTerms from '../datasets/school-terms.js'
import {
  OrganisationDefaults,
  ProgrammePreset,
  ProgrammeType,
  SessionType
} from '../enums.js'
import { Session } from '../models/session.js'
import { addDays, removeDays, setMidday } from '../utils/date.js'

/**
 * Generate fake session
 *
 * @param {string} programmePreset - Programme preset
 * @param {import('../models/user.js').User} user - User
 * @param {import('../enums.js').AcademicYear} academicYear - Academic year
 * @param {object} options - Options
 * @param {string} [options.clinic_id] - Clinic ID
 * @param {string} [options.school_urn] - School URN
 * @returns {Session} - Session
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
  const dates = []

  let firstSessionDate = faker.date.between({
    from: term.from,
    to: term.to
  })

  let openAt
  if (firstSessionDate) {
    // Clinic sessions happen after the school term has finished
    if (clinic_id) {
      firstSessionDate = faker.date.between({
        from: term.to,
        to: addDays(term.to, 30)
      })
    }

    firstSessionDate = setMidday(firstSessionDate)

    // Don’t create sessions during weekends
    if ([0, 6].includes(firstSessionDate.getDay())) {
      firstSessionDate = removeDays(firstSessionDate, 2)
    }

    dates.push(firstSessionDate)

    // Add additional session dates
    for (const _index of [1, 2]) {
      if (_index !== 0) {
        const previousDate = dates[_index - 1]
        const subsequentDate = setMidday(addDays(previousDate, 7))
        dates.push(subsequentDate)
      }
    }

    openAt = removeDays(
      firstSessionDate,
      OrganisationDefaults.SessionOpenWeeks * 7
    )
  }

  const sessionHasCatchups = faker.datatype.boolean(0.5)

  const psdProtocol = preset.primaryProgrammeTypes.includes(ProgrammeType.Flu)

  return new Session({
    createdAt: removeDays(term.from, 60),
    createdBy_uid: user.uid,
    dates,
    openAt,
    registration: true,
    academicYear,
    programmePreset,
    psdProtocol,
    ...(sessionHasCatchups && {
      catchupProgrammeTypes: preset.catchupProgrammeTypes
    }),
    ...(clinic_id && { type: SessionType.Clinic, clinic_id }),
    ...(school_urn && { type: SessionType.School, school_urn })
  })
}
