import { isAfter, isBefore } from 'date-fns'

import {
  ConsentWindow,
  ProgrammeType,
  SessionStatus,
  SessionType
} from '../enums.js'
import { programmeTypes } from '../models/programme.js'
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

export const getProgrammeSession = (sessions, type, isSchool = true) => {
  type = type || ProgrammeType.Flu
  const { id } = programmeTypes[type]
  const sessionType = isSchool ? SessionType.School : SessionType.Clinic

  return Object.values(sessions)
    .filter((session) => session?.primaryProgramme_ids.includes(id))
    .filter((session) => session.type === sessionType)
    .filter((session) => session.status !== SessionStatus.Unplanned)
    .at(-1)
}
