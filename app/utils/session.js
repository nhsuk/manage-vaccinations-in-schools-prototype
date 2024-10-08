import { isAfter, isBefore } from 'date-fns'
import { getToday } from '../utils/date.js'
import { ProgrammeType, programmeTypes } from '../models/programme.js'
import { ConsentWindow, Session, SessionType } from '../models/session.js'
import { getEnumKeyAndValue } from './enum.js'

/**
 * Get consent window (is it open, opening or closed)
 * @param {import('../models/session.js').Session} session - Session
 * @returns {object} Consent window key and value
 */
export const getConsentWindow = (session) => {
  const today = getToday()

  switch (true) {
    // Opening (open date is after today)
    case isAfter(session.open, today):
      return getEnumKeyAndValue(ConsentWindow, ConsentWindow.Opening)
    // Open (open date is before today, and close date after today)
    case isBefore(session.open, today) && isAfter(session.close, today):
      return getEnumKeyAndValue(ConsentWindow, ConsentWindow.Open)
    // Closed (close date is before today)
    case isBefore(session.close, today):
      return getEnumKeyAndValue(ConsentWindow, ConsentWindow.Closed)
    default:
      return getEnumKeyAndValue(ConsentWindow, ConsentWindow.None)
  }
}

export const getProgrammeSession = (sessions, type, isSchool = true) => {
  type = type || ProgrammeType.Flu
  const { pid } = programmeTypes[type]
  const sessionType = isSchool ? SessionType.School : SessionType.Clinic

  return Object.values(sessions)
    .map((session) => new Session(session))
    .filter((session) => session.programmes.includes(pid))
    .filter((session) => session.consentWindow.value === ConsentWindow.Open)
    .filter((session) => session.type === sessionType)
    .at(-1)
}
