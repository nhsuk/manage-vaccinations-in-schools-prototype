import { fakerEN_GB as faker } from '@faker-js/faker'
import { isAfter } from 'date-fns'

import { ProgrammePreset } from '../models/programme.js'
import { schoolTerms } from '../models/school.js'
import { Session, SessionStatus, SessionType } from '../models/session.js'
import { addDays, removeDays, setMidday, today } from '../utils/date.js'

/**
 * Generate fake session
 *
 * @param {string} programmePreset - Programme preset
 * @param {import('../models/user.js').User} user - User
 * @param {object} options - Options
 * @param {string} [options.clinic_id] - Clinic ID
 * @param {string} [options.school_urn] - School URN
 * @returns {Session} - Session
 */
export function generateSession(programmePreset, user, options) {
  // Get programme preset
  const preset = ProgrammePreset[programmePreset]

  // Don’t generate sessions for inactive programme presets
  if (!preset.active) {
    return
  }

  const { clinic_id, school_urn } = options
  const term = schoolTerms[preset.term]

  let status
  if (isAfter(today(), term.to)) {
    status = SessionStatus.Completed
  } else {
    status = faker.helpers.arrayElement([
      SessionStatus.Completed,
      SessionStatus.Planned,
      SessionStatus.Unplanned
    ])
  }

  const dates = []
  let firstSessionDate
  const tomorrow = addDays(today(), 1)
  switch (status) {
    case SessionStatus.Planned:
      // Earliest date is tomorrow
      // Latest date is the last day of term
      firstSessionDate = faker.date.between({
        from: tomorrow,
        to: term.to
      })
      break
    case SessionStatus.Completed:
      // Earliest date is first day of term
      // Latest date is the last day of term
      firstSessionDate = faker.date.between({
        from: term.from,
        to: term.to
      })
      break
    case SessionStatus.Unplanned:
    default:
      firstSessionDate = undefined
  }

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
  }

  const sessionHasCatchups = faker.datatype.boolean(0.5)

  return new Session({
    createdAt: removeDays(term.from, 60),
    createdBy_uid: user.uid,
    dates,
    registration: true,
    programmePreset,
    ...(sessionHasCatchups && {
      catchupProgrammeTypes: preset.catchupProgrammeTypes
    }),
    ...(clinic_id && { type: SessionType.Clinic, clinic_id }),
    ...(school_urn && { type: SessionType.School, school_urn })
  })
}
