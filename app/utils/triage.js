import {
  ReplyDecision,
  ScreenOutcome,
  ScreenVaccineCriteria
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

  const hasConsentForAlternativeInjectionOnly = replies?.every(
    ({ decision }) => decision === ReplyDecision.OnlyAlternativeInjection
  )

  return [
    ...(!programme?.alternativeVaccine ? [ScreenOutcome.Vaccinate] : []),
    ...(programme?.alternativeVaccine && !hasConsentForAlternativeInjectionOnly
      ? [ScreenOutcome.VaccinateIntranasal]
      : []),
    ...(programme?.alternativeVaccine && hasConsentForInjection
      ? [ScreenOutcome.VaccinateAlternativeInjection]
      : []),
    'or',
    ScreenOutcome.NeedsTriage,
    ScreenOutcome.DelayVaccination,
    ScreenOutcome.DoNotVaccinate
  ]
}

/**
 * Get vaccination criteria consented to use if safe to vaccinate
 *
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {Array<import('../models/reply.js').Reply>} replies - Replies
 * @returns {import('../enums.js').ScreenVaccineCriteria|boolean} Criteria
 */
export const getScreenVaccineCriteria = (programme, replies) => {
  const hasConsentForInjection = replies?.every(
    ({ hasConsentForInjection }) => hasConsentForInjection
  )

  const hasConsentForAlternativeInjectionOnly = replies?.every(
    ({ decision }) => decision === ReplyDecision.OnlyAlternativeInjection
  )

  if (programme?.alternativeVaccine) {
    if (hasConsentForAlternativeInjectionOnly) {
      return ScreenVaccineCriteria.AlternativeInjection
    } else if (!hasConsentForInjection) {
      return ScreenVaccineCriteria.Intranasal
    }

    return ScreenVaccineCriteria.Either
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
