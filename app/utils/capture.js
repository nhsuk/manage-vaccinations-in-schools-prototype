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

/**
 * Get consent status properties
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @param {import('../models/programme.js').Programme} programme - Patient session
 * @returns {object} - Consent status properties
 */
export const getConsentStatus = (patientSession, programme) => {
  const { consentOutcomes, patient, parentalRelationships } = patientSession
  const consentOutcome = consentOutcomes[programme.pid]

  let colour
  let description
  let icon
  switch (consentOutcome) {
    case ConsentOutcome.NoResponse:
      colour = 'grey'
      description = 'No-one responded to our requests for consent.'
      break
    case ConsentOutcome.NoRequest:
      colour = 'dark-orange'
      description = 'Consent response could not be delivered.'
      break
    case ConsentOutcome.Inconsistent:
      colour = 'dark-orange'
      description = 'You can only vaccinate if all respondents give consent.'
      icon = 'cross'
      break
    case ConsentOutcome.Given:
      colour = 'aqua-green'
      description = `${patient.fullName} is ready for the vaccinator.`
      icon = 'tick'
      break
    case ConsentOutcome.Refused:
      colour = 'red'
      description = `${parentalRelationships} refused to give consent.`
      icon = 'cross'
      break
    case ConsentOutcome.FinalRefusal:
      colour = 'red'
      description = `Refusal to give consent confirmed by ${parentalRelationships}.`
      icon = 'cross'
      break
    default:
  }

  return {
    colour,
    description,
    icon,
    text: `${consentOutcome} for ${programme.name}`
  }
}

/**
 * Get registration status properties
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} - Registration status properties
 */
export const getRegistrationStatus = (patientSession) => {
  let colour
  let description
  switch (patientSession.registration) {
    case RegistrationOutcome.Present:
      colour = 'green'
      description = `Registered as attending today’s session at ${patientSession.session.location.name}`
      break
    case RegistrationOutcome.Absent:
      colour = 'red'
      description = `Registered as absent from today’s session at ${patientSession.session.location.name}`
      break
    case RegistrationOutcome.Complete:
      colour = 'white'
      break
    default:
      colour = 'blue'
  }

  return {
    colour,
    description,
    text: patientSession.registration
  }
}
