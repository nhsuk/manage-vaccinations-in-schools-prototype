import {
  ConsentOutcome,
  ScreenOutcome,
  TriageOutcome
} from '../models/patient.js'
import { getEnumKeyAndValue } from './enum.js'
import { getRepliesWithHealthAnswers } from './reply.js'

/**
 * Get screen outcome (what was the triage decision)
 * @param {import('../models/patient.js').Patient} patient - Patient
 * @returns {object} Screen outcome key and value
 */
export const getScreenOutcome = (patient) => {
  if (patient.consent.value !== ConsentOutcome.Given) {
    return false
  }

  const replies = Object.values(patient.replies)
  const repliesToTriage = getRepliesWithHealthAnswers(replies)

  if (repliesToTriage.length === 0) {
    return false
  }

  if (repliesToTriage.length > 0) {
    const lastTriageNoteWithOutcome = patient.triageNotes
      .filter((event) => event.info_?.outcome)
      .at(-1)

    if (lastTriageNoteWithOutcome) {
      return getEnumKeyAndValue(
        ScreenOutcome,
        lastTriageNoteWithOutcome.info_.outcome
      )
    }

    return getEnumKeyAndValue(ScreenOutcome, ScreenOutcome.NeedsTriage)
  }

  return false
}

/**
 * Get triage outcome (has triage taken place)
 * @param {import('../models/patient.js').Patient} patient - Patient
 * @returns {object} Outcome key and value
 */
export const getTriageOutcome = (patient) => {
  if (patient.screen && patient.screen.value === ScreenOutcome.NeedsTriage) {
    return getEnumKeyAndValue(TriageOutcome, TriageOutcome.Needed)
  } else if (patient.screen) {
    return getEnumKeyAndValue(TriageOutcome, TriageOutcome.Completed)
  } else {
    return getEnumKeyAndValue(TriageOutcome, TriageOutcome.NotNeeded)
  }
}
