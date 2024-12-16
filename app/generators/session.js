import { fakerEN_GB as faker } from '@faker-js/faker'
import { isAfter } from 'date-fns'

import { Session, SessionStatus } from '../models/session.js'
import { addDays, removeDays, getToday, setMidday } from '../utils/date.js'

/**
 * Generate fake session
 *
 * @param {object} term - Term dates
 * @param {import('../models/user.js').User} user - User
 * @param {Array<string>} programme_pids - Programme PIDs
 * @param {object} options - Options
 * @param {string} [options.clinic_id] - Clinic ID
 * @param {string} [options.school_urn] - School URN
 * @returns {Session} - Session
 */
export function generateSession(programme_pids, term, user, options) {
  const { clinic_id, school_urn } = options

  let status
  if (isAfter(getToday(), term.to)) {
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
  const tomorrow = addDays(getToday(), 1)
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

  return new Session({
    createdAt: removeDays(getToday(), 70),
    createdBy_uid: user.uid,
    dates,
    programme_pids,
    ...(clinic_id && { clinic_id }),
    ...(school_urn && { school_urn })
  })
}
