import { default as filters } from '@x-govuk/govuk-prototype-filters'
import { isAfter, isBefore } from 'date-fns'
import _ from 'lodash'

import {
  ConsentWindow,
  PatientOutcome,
  SessionStatus,
  SessionType
} from '../enums.js'
import { today } from '../utils/date.js'
import { formatLink } from '../utils/string.js'

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

/**
 * Filter array where key has a value
 *
 * @param {import('../models/session.js').Session} session - Session
 * @param {string} key - Key to check
 * @param {string} value - Value to check
 * @returns {number} Number
 */
export const getSessionActivityCount = (session, key, value) => {
  const patientSessions = session.patientSessions.filter(
    (item) => _.get(item, key) === value
  )

  if (patientSessions) {
    const uniquePatientSessions = _.uniqBy(patientSessions, 'patient.nhsn')
    return uniquePatientSessions.length
  }

  return 0
}

export const getPatientsToRecordCount = (session) => {
  const patientsToRecord =
    session.patientsToRecordPerProgramme &&
    Object.entries(session.patientsToRecordPerProgramme).map(
      ([name, patientSessions]) =>
        session.programmes.length > 1
          ? patientSessions.length > 0
            ? formatLink(
                `${session.uri}/record`,
                `${filters.plural(patientSessions.length, 'child')} are ready for ${name}`
              )
            : 'No children'
          : patientSessions.length > 0
            ? formatLink(
                `${session.uri}/record`,
                `${filters.plural(patientSessions.length, 'child')} are ready`
              )
            : 'No children'
    )

  return patientsToRecord ? patientsToRecord?.join('<br>') : undefined
}

export const getPatientsVaccinatedCount = (session) => {
  const patientsVaccinated =
    session.patientsVaccinatedPerProgramme &&
    Object.entries(session.patientsVaccinatedPerProgramme).map(
      ([name, patientSessions]) =>
        session.programmes.length > 1
          ? patientSessions.length > 0
            ? formatLink(
                `${session.uri}/outcomes?outcome=${PatientOutcome.Vaccinated}`,
                `${filters.plural(patientSessions.length, 'vaccination')} given for ${name}`
              )
            : `No vaccinations given for ${name}`
          : patientSessions.length > 0
            ? formatLink(
                `${session.uri}/outcomes?outcome=${PatientOutcome.Vaccinated}`,
                `${filters.plural(patientSessions.length, 'vaccination')} given`
              )
            : 'No vaccinations given'
    )

  return patientsVaccinated ? patientsVaccinated.join('<br>') : undefined
}
