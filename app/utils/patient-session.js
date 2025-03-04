import prototypeFilters from '@x-govuk/govuk-prototype-filters'

import {
  Activity,
  ConsentOutcome,
  PatientOutcome,
  ScreenOutcome,
  TriageOutcome
} from '../models/patient-session.js'
import { RegistrationOutcome } from '../models/session.js'
import { VaccinationOutcome } from '../models/vaccination.js'

/**
 * Get next activity
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {Activity} Activity
 */
export const getNextActivity = ({ consent, triage, screen, outcome }) => {
  if (![ConsentOutcome.Given, ConsentOutcome.FinalRefusal].includes(consent)) {
    return Activity.Consent
  }

  if (triage === TriageOutcome.Needed) {
    return Activity.Triage
  }

  if (
    screen !== ScreenOutcome.NeedsTriage &&
    outcome === PatientOutcome.NoOutcomeYet
  ) {
    return Activity.Record
  }

  if (outcome !== PatientOutcome.NoOutcomeYet) {
    return Activity.Report
  }
}

/**
 * Get consent status properties
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} - Consent status properties
 */
export const getConsentStatus = (patientSession) => {
  const { consent, patient, parentalRelationships } = patientSession
  const relationships = prototypeFilters.formatList(parentalRelationships)

  let colour
  let description
  let icon
  switch (consent) {
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
      description = `${relationships} refused to give consent.`
      icon = 'cross'
      break
    case ConsentOutcome.FinalRefusal:
      colour = 'red'
      description = `Refusal to give consent confirmed by ${relationships}.`
      icon = 'cross'
      break
    default:
  }

  return {
    colour,
    description,
    icon,
    reason: consent,
    text: consent
  }
}

/**
 * Get triage status properties
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} - Triage status properties
 */
export const getTriageStatus = (patientSession) => {
  const { triage } = patientSession

  let colour
  switch (triage) {
    case TriageOutcome.Needed:
      colour = 'blue'
      break
    case TriageOutcome.NotNeeded:
      colour = 'grey'
      break
    case TriageOutcome.Completed:
      colour = false
      break
    default:
  }

  return {
    colour,
    text: triage
  }
}

/**
 * Get screen status properties
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} - Screen status properties
 */
export const getScreenStatus = (patientSession) => {
  const { patient, screen, triageNotes } = patientSession

  const triageNote = triageNotes.at(-1)
  const user = triageNote?.createdBy || { fullName: 'Jane Joy' }

  let colour
  let description
  let reason = screen
  switch (screen) {
    case ScreenOutcome.NeedsTriage:
      colour = 'blue'
      description = 'You need to decide if it’s safe to vaccinate.'
      break
    case ScreenOutcome.DelayVaccination:
      colour = 'dark-orange'
      description = `${user.fullName} decided that ${patient.fullName}’s vaccination should be delayed.`
      reason = 'Vaccination delayed'
      break
    case ScreenOutcome.DoNotVaccinate:
      colour = 'red'
      description = `${user.fullName} decided that ${patient.fullName} should not be vaccinated.`
      reason = 'Do not vaccinate in this year’s programme'
      break
    case ScreenOutcome.Vaccinate:
      colour = 'aqua-green'
      description = `${user.fullName} decided that ${patient.fullName} is safe to vaccinate.`
      break
    default:
  }

  return {
    colour,
    description,
    reason,
    text: screen
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

/**
 * Get vaccination record status properties
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} - Vaccination record status properties
 */
export const getRecordStatus = (patientSession) => {
  const { record } = patientSession

  let colour
  switch (String(record)) {
    case VaccinationOutcome.Vaccinated:
    case VaccinationOutcome.PartVaccinated:
    case VaccinationOutcome.AlreadyVaccinated:
      colour = 'green'
      break
    default:
      colour = 'white'
  }

  return {
    colour,
    text: record
  }
}

/**
 * Get patient outcome status properties
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} - Patient outcome status properties
 */
export const getOutcomeStatus = (patientSession) => {
  const { outcome } = patientSession

  let colour
  switch (outcome) {
    case PatientOutcome.Vaccinated:
      colour = 'green'
      break
    case PatientOutcome.CouldNotVaccinate:
      colour = 'red'
      break
    case PatientOutcome.NoOutcomeYet:
    default:
      colour = 'white'
      break
  }

  return {
    colour,
    text: outcome
  }
}

/**
 * Get registration outcome
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {RegistrationOutcome} - Registration outcome
 */
export const getRegistrationOutcome = (patientSession) => {
  const { patient, session, outcome } = patientSession

  if (outcome === PatientOutcome.Vaccinated) {
    return RegistrationOutcome.Complete
  } else if (session.register[patient.uuid]) {
    return session.register[patient.uuid]
  }

  return RegistrationOutcome.Pending
}

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
