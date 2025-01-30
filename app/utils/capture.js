import {
  CaptureOutcome,
  ConsentOutcome,
  Jabs,
  PatientOutcome,
  RegistrationOutcome,
  ScreenOutcome,
  TriageOutcome
} from '../models/patient-session.js'
import { kebabToPascalCase } from '../utils/string.js'

/**
 * Get jabs (completed vaccinations against those needed)
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {Jabs} Jabs
 */
export const getJabs = (patientSession) => {
  if (
    patientSession.administeredVaccinations.length ===
    patientSession.session.programmes.length
  ) {
    // All vaccinations administered by the programme have been given
    // TODO: Compare against eligible vaccinations, based on consent responses?
    return Jabs.All
  } else if (patientSession.administeredVaccinations.length === 1) {
    // One of the vaccinations administered by the programme has been given
    const vaccination = patientSession.administeredVaccinations[0]
    const type = kebabToPascalCase(vaccination.programme_pid)
    return Jabs[type]
  }

  return Jabs.None
}

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
 * Get patient outcome for a programme
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @param {string} pid - Programme PID
 * @returns {PatientOutcome} Patient outcome
 */
export const getProgrammeOutcome = (patientSession, pid) => {
  const programmeVaccinations = patientSession.vaccinations.filter(
    ({ programme_pid }) => programme_pid === pid
  )

  if (programmeVaccinations.length === 1) {
    if (programmeVaccinations[0].given === true) {
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
