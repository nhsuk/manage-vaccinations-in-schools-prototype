import { isAfter, isBefore } from 'date-fns'
import _ from 'lodash'

import { ConsentWindow, SessionStatus, SessionType } from '../enums.js'
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

export const getProgrammeSession = (sessions, id, isSchool = true) => {
  const sessionType = isSchool ? SessionType.School : SessionType.Clinic

  return Object.values(sessions)
    .filter((session) => session?.primaryProgramme_ids?.includes(id))
    .filter((session) => session.type === sessionType)
    .filter((session) => session.status !== SessionStatus.Unplanned)
    .at(-1)
}

/**
 * Filter array where key has a value
 *
 * @param {import('../models/session.js').Session} session - Session
 * @param {Array} filters - Filters
 * @returns {number} Number
 */
export const getSessionActivityCount = (session, filters) => {
  let patientSessions = session.patientSessions

  for (const filter of filters) {
    for (const [key, value] of Object.entries(filter)) {
      patientSessions = patientSessions.filter(
        (patientSession) => _.get(patientSession, key) === value
      )
    }
  }

  if (patientSessions) {
    const uniquePatientSessions = _.uniqBy(patientSessions, 'patient.nhsn')
    return uniquePatientSessions.length
  }

  return 0
}
