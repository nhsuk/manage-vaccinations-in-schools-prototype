import { isAfter, isBefore } from 'date-fns'

// eslint-disable-next-line no-unused-vars
import { ProgrammeType } from '../models/programme.js'
import { ConsentWindow, SessionStatus, SessionType } from '../models/session.js'
import { today } from '../utils/date.js'

/**
 * Get consent window (is it open, opening or closed)
 *
 * @param {import('../models/session.js').Session} session - Session
 * @returns {object} Consent window key and value
 */
export const getConsentWindow = (session) => {
  const nowAt = today()

  switch (true) {
    // Opening (open date is after today)
    case isAfter(session.openAt, nowAt):
      return ConsentWindow.Opening
    // Open (open date is before today, and close date after today)
    case isBefore(session.openAt, nowAt) && isAfter(session.closeAt, nowAt):
      return ConsentWindow.Open
    // Closed (close date is before today)
    case isBefore(session.closeAt, nowAt):
      return ConsentWindow.Closed
    default:
      return ConsentWindow.None
  }
}

/**
 * Get consent URL
 *
 * @param {import('../models/session.js').Session[]} sessions - Sessions
 * @param {string} [programmePreset] - Programme preset name
 * @param {boolean} [isSchool] - Get school session
 * @returns {object} Consent window key and value
 */
export const getSessionConsentUrl = (
  sessions,
  programmePreset = 'SeasonalFlu',
  isSchool = true
) => {
  const sessionType = isSchool ? SessionType.School : SessionType.Clinic

  const session = Object.values(sessions)
    .filter((session) => session?.programmePreset === programmePreset)
    .filter((session) => session.type === sessionType)
    .find((session) => session.status !== SessionStatus.Unplanned)

  if (session) {
    return session.consentUrl
  }
}
