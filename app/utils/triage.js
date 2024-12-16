import { TriageOutcome } from '../models/patient-session.js'
import { ConsentOutcome, ScreenOutcome } from '../models/patient.js'

import { getEnumKeyAndValue } from './enum.js'
import { getRepliesWithHealthAnswers } from './reply.js'

/**
 * Get screen outcome (what was the triage decision)
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} Screen outcome key and value
 */
export const getScreenOutcome = (patientSession) => {
  if (patientSession.consent.value !== ConsentOutcome.Given) {
    return false
  }

  const replies = Object.values(patientSession.replies)
  const repliesToTriage = getRepliesWithHealthAnswers(replies)

  if (repliesToTriage.length === 0) {
    return false
  }

  if (repliesToTriage.length > 0) {
    const lastTriageNoteWithOutcome = patientSession.patient.triageNotes
      .filter((event) => event.info_)
      .at(-1)

    if (lastTriageNoteWithOutcome) {
      return getEnumKeyAndValue(ScreenOutcome, lastTriageNoteWithOutcome.info_)
    }

    return getEnumKeyAndValue(ScreenOutcome, ScreenOutcome.NeedsTriage)
  }

  return false
}

/**
 * Get triage outcome (has triage taken place)
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} Outcome key and value
 */
export const getTriageOutcome = (patientSession) => {
  if (
    patientSession.screen &&
    patientSession.screen.value === ScreenOutcome.NeedsTriage
  ) {
    return getEnumKeyAndValue(TriageOutcome, TriageOutcome.Needed)
  } else if (patientSession.screen) {
    return getEnumKeyAndValue(TriageOutcome, TriageOutcome.Completed)
  }
  return getEnumKeyAndValue(TriageOutcome, TriageOutcome.NotNeeded)
}
