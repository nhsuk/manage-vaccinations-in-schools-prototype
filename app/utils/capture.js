import {
  CaptureOutcome,
  ConsentOutcome,
  PatientOutcome,
  RegistrationOutcome,
  ScreenOutcome,
  TriageOutcome
} from '../models/patient-session.js'

/**
 * Get patient outcome
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {PatientOutcome} Patient outcome
 */
export const getPatientOutcome = (patientSession) => {
  if (patientSession.vaccinations.length === 1) {
    if (patientSession.vaccinations[0].given === true) {
      return PatientOutcome.Vaccinated
    }
  }

  // Consent outcome
  if (
    patientSession.consent === ConsentOutcome.Refused ||
    patientSession.consent === ConsentOutcome.Inconsistent
  ) {
    return PatientOutcome.CouldNotVaccinate
  }

  // Screen outcome
  if (
    patientSession.screen === ScreenOutcome.DelayVaccination ||
    patientSession.screen === ScreenOutcome.DoNotVaccinate
  ) {
    return PatientOutcome.CouldNotVaccinate
  }

  return PatientOutcome.NoOutcomeYet
}

/**
 * Get capture outcome (what capture activity needs to be performed)
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {CaptureOutcome|RegistrationOutcome} Capture outcome
 */
export const getCaptureOutcome = (patientSession) => {
  if (patientSession.registration === RegistrationOutcome.Present) {
    if (patientSession.consent === ConsentOutcome.NoResponse) {
      return CaptureOutcome.GetConsent
    } else if (
      patientSession.consent === ConsentOutcome.Refused ||
      patientSession.consent === ConsentOutcome.Inconsistent
    ) {
      return CaptureOutcome.CheckRefusal
    }

    if (patientSession.triage === TriageOutcome.Needed) {
      return CaptureOutcome.NeedsTriage
    }

    if (
      patientSession.triage !== TriageOutcome.Needed &&
      patientSession.outcome !== PatientOutcome.Vaccinated
    ) {
      return CaptureOutcome.Vaccinate
    }

    if (patientSession.outcome === PatientOutcome.Vaccinated) {
      return
    }
  }

  if (patientSession.registration === RegistrationOutcome.Absent) {
    return RegistrationOutcome.Absent
  }

  return CaptureOutcome.Register
}
