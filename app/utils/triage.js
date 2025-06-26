import {
  ConsentOutcome,
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
 * @returns {Array<ScreenOutcome>} - Screen outcomes
 */
export const getScreenOutcomesForConsentMethod = (programme, replies) => {
  const hasConsentForInjection = replies?.every(
    ({ hasConsentForInjection }) => hasConsentForInjection
  )

  const hasConsentForInjectionOnly = replies?.every(
    ({ decision }) => decision === ReplyDecision.OnlyFluInjection
  )

  return [
    ...(!programme?.hasAlternativeVaccines ? [ScreenOutcome.Vaccinate] : []),
    ...(programme?.hasAlternativeVaccines && !hasConsentForInjectionOnly
      ? [ScreenOutcome.VaccinateNasal]
      : []),
    ...(programme?.hasAlternativeVaccines && hasConsentForInjection
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
 * @returns {import('../enums.js').ScreenVaccinationMethod|boolean} - Method
 */
export const getScreenVaccinationMethod = (programme, replies) => {
  const hasConsentForInjection = replies?.every(
    ({ hasConsentForInjection }) => hasConsentForInjection
  )

  const hasConsentForInjectionOnly = replies?.every(
    ({ decision }) => decision === ReplyDecision.OnlyFluInjection
  )

  if (programme?.hasAlternativeVaccines) {
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
  if (patientSession.consent !== ConsentOutcome.Given) {
    return false
  }

  const responses = Object.values(patientSession.responses)
  const responsesToTriage = getRepliesWithHealthAnswers(responses)

  if (responsesToTriage.length === 0) {
    return false
  }

  if (responsesToTriage.length > 0) {
    const lastTriageNoteWithOutcome = patientSession.triageNotes
      .filter((event) => event.outcome)
      .at(-1)

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
