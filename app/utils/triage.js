import {
  ProgrammeType,
  ReplyDecision,
  ScreenOutcome,
  ScreenVaccineMethod,
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
  const hasConsentForAlternative = replies?.every(
    ({ hasConsentForAlternative }) => hasConsentForAlternative
  )

  const hasConsentForAlternativeOnly = replies?.every(({ decision }) =>
    [ReplyDecision.OnlyAlternative].includes(decision)
  )

  return [
    ...(!programme?.alternativeVaccine ? [ScreenOutcome.Vaccinate] : []),
    ...(programme?.alternativeVaccine && !hasConsentForAlternativeOnly
      ? programme.type === ProgrammeType.Flu
        ? [ScreenOutcome.VaccinateNasal]
        : [ScreenOutcome.Vaccinate]
      : []),
    ...(programme?.alternativeVaccine && hasConsentForAlternative
      ? [ScreenOutcome.VaccinateAlternative]
      : []),
    'or',
    ScreenOutcome.NeedsTriage,
    ScreenOutcome.DelayVaccination,
    ScreenOutcome.DoNotVaccinate
  ]
}

/**
 * Get vaccine method(s) consented to use if safe to vaccinate
 *
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {Array<import('../models/reply.js').Reply>} replies - Replies
 * @returns {import('../enums.js').ScreenVaccineMethod|boolean} Method
 */
export const getScreenVaccineMethod = (programme, replies) => {
  const hasConsentForAlternative = replies?.every(
    ({ hasConsentForAlternative }) => hasConsentForAlternative
  )

  const hasConsentForAlternativeOnly = replies?.every(({ decision }) =>
    [ReplyDecision.OnlyAlternative].includes(decision)
  )

  if (programme?.alternativeVaccine) {
    if (hasConsentForAlternativeOnly) {
      return ScreenVaccineMethod.AlternativeOnly
    } else if (!hasConsentForAlternative) {
      return ScreenVaccineMethod.NasalSprayOnly
    }

    return ScreenVaccineMethod.Any
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
