import {
  ConsentOutcome,
  ScreenOutcome,
  TriageOutcome
} from '../models/patient-session.js'

import { getRepliesWithHealthAnswers } from './reply.js'

/**
 * Get screen outcome (what was the triage decision)
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {ScreenOutcome|boolean} Screen outcome
 */
export const getScreenOutcome = (patientSession) => {
  if (patientSession.consent !== ConsentOutcome.Given) {
    return false
  }

  const responses = Object.values(patientSession.responses)
  const responsesToTriage = getRepliesWithHealthAnswers(responses)

  if (responsesToTriage.length === 0) {
    return false
  }

  if (responsesToTriage.length > 0) {
    const lastTriageNoteWithOutcome = patientSession.patient.triageNotes
      .filter((event) => event.info_)
      .at(-1)

    if (lastTriageNoteWithOutcome) {
      return lastTriageNoteWithOutcome.info_
    }

    return ScreenOutcome.NeedsTriage
  }

  return false
}

/**
 * Get triage outcome (has triage taken place)
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {TriageOutcome} Outcome key and value
 */
export const getTriageOutcome = (patientSession) => {
  if (patientSession.screen === ScreenOutcome.NeedsTriage) {
    return TriageOutcome.Needed
  } else if (patientSession.screen) {
    return TriageOutcome.Completed
  }
  return TriageOutcome.NotNeeded
}
