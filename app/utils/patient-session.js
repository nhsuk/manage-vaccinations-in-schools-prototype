import {
  Activity,
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
  if (patientSession.vaccinations.length > 0) {
    if (patientSession.vaccinations.at(-1).given) {
      return PatientOutcome.Vaccinated
    }

    return PatientOutcome.CouldNotVaccinate
  }

  // Consent outcome
  if (
    patientSession.consent === ConsentOutcome.Refused ||
    patientSession.consent === ConsentOutcome.FinalRefusal ||
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
 * Get next activity
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {Activity} Activity
 */
export const getNextActivity = ({
  consent,
  triage,
  screen,
  registration,
  outcome,
  session
}) => {
  if (session.isActive && registration === RegistrationOutcome.Pending) {
    return Activity.Register
  }

  if (
    consent === ConsentOutcome.NoResponse ||
    consent === ConsentOutcome.NoRequest
  ) {
    return Activity.Consent
  }

  if (triage === TriageOutcome.Needed) {
    return Activity.Triage
  }

  if (
    session.isActive &&
    screen !== ScreenOutcome.NeedsTriage &&
    outcome === PatientOutcome.NoOutcomeYet
  ) {
    return Activity.Record
  }

  if (outcome !== PatientOutcome.NoOutcomeYet) {
    return Activity.Report
  }
}
