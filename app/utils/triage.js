import {
  ReplyDecision,
  ScreenOutcome,
  ScreenVaccinationMethod,
  TriageOutcome
} from '../enums.js'

import { getRepliesWithHealthAnswers } from './reply.js'

/**
 * Get screen outcomes for vaccination method(s) consented to
 *
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {Array<import('../models/reply.js').Reply>} replies - Replies
 * @returns {Array<ScreenOutcome>} Screen outcomes
 */
export const getScreenOutcomesForConsentMethod = (programme, replies) => {
  const hasConsentForInjection = replies?.every(
    ({ hasConsentForInjection }) => hasConsentForInjection
  )

  const hasConsentForInjectionOnly = replies?.every(
    ({ decision }) => decision === ReplyDecision.OnlyFluInjection
  )

  return [
    ...(!programme?.alternativeVaccine ? [ScreenOutcome.Vaccinate] : []),
    ...(programme?.alternativeVaccine && !hasConsentForInjectionOnly
      ? [ScreenOutcome.VaccinateNasal]
      : []),
    ...(programme?.alternativeVaccine && hasConsentForInjection
      ? [ScreenOutcome.VaccinateInjection]
      : []),
    'or',
    ScreenOutcome.NeedsTriage,
    ScreenOutcome.DelayVaccination,
    ScreenOutcome.DoNotVaccinate
  ]
}

/**
 * Get vaccination method(s) consented to use if safe to vaccinate
 *
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {Array<import('../models/reply.js').Reply>} replies - Replies
 * @returns {import('../enums.js').ScreenVaccinationMethod|boolean} Method
 */
export const getScreenVaccinationMethod = (programme, replies) => {
  const hasConsentForInjection = replies?.every(
    ({ hasConsentForInjection }) => hasConsentForInjection
  )

  const hasConsentForInjectionOnly = replies?.every(
    ({ decision }) => decision === ReplyDecision.OnlyFluInjection
  )

  if (programme?.alternativeVaccine) {
    if (hasConsentForInjectionOnly) {
      return ScreenVaccinationMethod.InjectionOnly
    } else if (!hasConsentForInjection) {
      return ScreenVaccinationMethod.NasalOnly
    }

    return ScreenVaccinationMethod.NasalOrInjection
  }

  return false
}

/**
 * Get screen outcome (what was the triage decision)
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {ScreenOutcome|boolean} Screen outcome
 */
export const getScreenOutcome = (patientSession) => {
  if (!patientSession.consentGiven) {
    return false
  }

  const responses = Object.values(patientSession.responses)
  const responsesToTriage = getRepliesWithHealthAnswers(responses)
  const lastTriageNoteWithOutcome = patientSession.triageNotes
    .filter((event) => event.outcome)
    .at(-1)

  // Triage completed without any answers to health questions
  if (responsesToTriage.length === 0) {
    if (lastTriageNoteWithOutcome) {
      return lastTriageNoteWithOutcome.outcome
    }

    return false
  }

  // Triage needed or completed due to answers to health questions
  if (responsesToTriage.length > 0) {
    if (lastTriageNoteWithOutcome) {
      return lastTriageNoteWithOutcome.outcome
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
