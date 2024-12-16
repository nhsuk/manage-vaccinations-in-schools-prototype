import {
  RegistrationOutcome,
  TriageOutcome
} from '../models/patient-session.js'
import {
  CaptureOutcome,
  ConsentOutcome,
  PatientOutcome,
  ScreenOutcome
} from '../models/patient.js'

import { getEnumKeyAndValue } from './enum.js'

/**
 * Get patient outcome
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} Patient outcome
 */
export const getPatientOutcome = (patientSession) => {
  if (patientSession.vaccinations.length === 1) {
    if (patientSession.vaccinations[0].given === true) {
      return getEnumKeyAndValue(PatientOutcome, PatientOutcome.Vaccinated)
    }
  }

  // Consent outcome
  if (
    patientSession.consent.value === ConsentOutcome.Refused ||
    patientSession.consent.value === ConsentOutcome.Inconsistent
  ) {
    return getEnumKeyAndValue(PatientOutcome, PatientOutcome.CouldNotVaccinate)
  }

  // Screen outcome
  if (
    patientSession.screen.value === ScreenOutcome.DelayVaccination ||
    patientSession.screen.value === ScreenOutcome.DoNotVaccinate
  ) {
    return getEnumKeyAndValue(PatientOutcome, PatientOutcome.CouldNotVaccinate)
  }

  return getEnumKeyAndValue(PatientOutcome, PatientOutcome.NoOutcomeYet)
}

/**
 * Get capture outcome (what capture activity needs to be performed)
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} Outcome key and value
 */
export const getCaptureOutcome = (patientSession) => {
  if (patientSession.registration === RegistrationOutcome.Present) {
    if (patientSession.consent.value === ConsentOutcome.NoResponse) {
      return getEnumKeyAndValue(CaptureOutcome, CaptureOutcome.GetConsent)
    } else if (
      patientSession.consent.value === ConsentOutcome.Refused ||
      patientSession.consent.value === ConsentOutcome.Inconsistent
    ) {
      return getEnumKeyAndValue(CaptureOutcome, CaptureOutcome.CheckRefusal)
    }

    if (patientSession.triage.value === TriageOutcome.Needed) {
      return getEnumKeyAndValue(CaptureOutcome, CaptureOutcome.NeedsTriage)
    }

    if (
      patientSession.triage.value !== TriageOutcome.Needed &&
      patientSession.outcome.value !== PatientOutcome.Vaccinated
    ) {
      return getEnumKeyAndValue(CaptureOutcome, CaptureOutcome.Vaccinate)
    }

    if (patientSession.outcome.value === PatientOutcome.Vaccinated) {
      return
    }
  }

  if (patientSession.registration === RegistrationOutcome.Absent) {
    return getEnumKeyAndValue(RegistrationOutcome, RegistrationOutcome.Absent)
  }

  return getEnumKeyAndValue(CaptureOutcome, CaptureOutcome.Register)
}
