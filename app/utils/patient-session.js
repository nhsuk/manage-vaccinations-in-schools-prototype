import prototypeFilters from '@x-govuk/govuk-prototype-filters'

import {
  Activity,
  ConsentOutcome,
  InstructionOutcome,
  PatientOutcome,
  RegistrationOutcome,
  ScreenOutcome,
  TriageOutcome,
  VaccinationOutcome,
  VaccineMethod
} from '../enums.js'

/**
 * Get next activity
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {Activity} Activity
 */
export const getNextActivity = ({
  consent,
  consentGiven,
  triage,
  screen,
  report
}) => {
  if ([ConsentOutcome.Refused, ConsentOutcome.FinalRefusal].includes(consent)) {
    return Activity.DoNotRecord
  }

  if (!consentGiven) {
    return Activity.Consent
  }

  if (triage === TriageOutcome.Needed) {
    return Activity.Triage
  }

  if (screen === ScreenOutcome.DoNotVaccinate) {
    return Activity.DoNotRecord
  }

  if (report === PatientOutcome.Vaccinated) {
    return Activity.Report
  }

  return Activity.Record
}

/**
 * Get consent status properties
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} Consent status properties
 */
export const getConsentStatus = (patientSession) => {
  const { consent, patient, parentalRelationships, parentsRequestingFollowUp } =
    patientSession
  const relationships = prototypeFilters.formatList(parentalRelationships)
  const parentNames = prototypeFilters.formatList(parentsRequestingFollowUp)

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
    case ConsentOutcome.GivenForInjection:
    case ConsentOutcome.GivenForNasalSpray:
      colour = 'aqua-green'
      description = `${patient.fullName} is ready for the vaccinator.`
      icon = 'tick'
      break
    case ConsentOutcome.Declined:
      colour = 'warm-yellow'
      description = `${parentNames} would like to speak to a member of the team about other options for their child’s vaccination.`
      icon = 'info'
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
 * @returns {object} Triage status properties
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
 * @returns {object} Screen status properties
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
    case ScreenOutcome.VaccinateInjection:
      colour = 'aqua-green'
      description = `${user.fullName} decided that ${patient.fullName} is safe to vaccinate using the injected vaccine only.`
      break
    case ScreenOutcome.VaccinateNasal:
      colour = 'aqua-green'
      description = `${user.fullName} decided that ${patient.fullName} is safe to vaccinate using the nasal spray only.`
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
 * Get instruction status properties
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} Instruction status properties
 */
export const getInstructionStatus = (patientSession) => {
  let colour
  switch (patientSession.instruct) {
    case InstructionOutcome.Given:
      colour = 'aqua-green'
      break
    default:
      colour = 'grey'
  }

  return {
    colour,
    text: patientSession.instruct
  }
}

/**
 * Get registration status properties
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} Registration status properties
 */
export const getRegistrationStatus = (patientSession) => {
  let colour
  let description
  switch (patientSession.register) {
    case RegistrationOutcome.Present:
      colour = 'aqua-green'
      description = `Registered as attending today’s session at ${patientSession.session.location.name}`
      break
    case RegistrationOutcome.Absent:
      colour = 'red'
      description = `Registered as absent from today’s session at ${patientSession.session.location.name}`
      break
    case RegistrationOutcome.Complete:
      colour = 'green'
      break
    default:
      colour = 'grey'
  }

  return {
    colour,
    description,
    text: patientSession.register
  }
}

/**
 * Get vaccination (session) outcome status properties
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} Vaccination (session) outcome status properties
 */
export const getOutcomeStatus = (patientSession) => {
  const { outcome } = patientSession

  let colour
  switch (String(outcome)) {
    case VaccinationOutcome.Vaccinated:
    case VaccinationOutcome.PartVaccinated:
    case VaccinationOutcome.AlreadyVaccinated:
      colour = 'green'
      break
    case VaccinationOutcome.Contraindications:
    case VaccinationOutcome.Refused:
    case VaccinationOutcome.Absent:
    case VaccinationOutcome.Unwell:
    case VaccinationOutcome.NoConsent:
      colour = 'dark-orange'
      break
    default:
      colour = 'white'
  }

  return {
    colour,
    text: outcome
  }
}

/**
 * Get patient (programme) outcome status properties
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {object} Patient (programme) outcome status properties
 */
export const getReportStatus = (patientSession) => {
  const { report } = patientSession

  let colour
  switch (report) {
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
    text: report
  }
}

/**
 * Get instruction outcome for nasal spray
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {InstructionOutcome|boolean} Instruction outcome
 */
export const getInstructionOutcome = (patientSession) => {
  if (!patientSession.vaccine) {
    return false
  }

  if (patientSession.vaccine.method === VaccineMethod.Nasal) {
    return patientSession.instruction
      ? InstructionOutcome.Given
      : InstructionOutcome.Needed
  }

  return false
}

/**
 * Get registration outcome
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {RegistrationOutcome} Registration outcome
 */
export const getRegistrationOutcome = (patientSession) => {
  const { patient, session, report } = patientSession

  if (!session.registration) {
    return RegistrationOutcome.Present
  }

  if (report === PatientOutcome.Vaccinated) {
    return RegistrationOutcome.Complete
  } else if (session.register[patient.uuid]) {
    return session.register[patient.uuid]
  }

  return RegistrationOutcome.Pending
}

/**
 * Get ready to record outcome
 * Check if registration is needed prior to recording vaccination
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {RegistrationOutcome} Ready to record outcome
 */
export const getRecordOutcome = (patientSession) => {
  const { nextActivity, register, session } = patientSession

  if (nextActivity === Activity.Record) {
    if (session.registration && register === RegistrationOutcome.Pending) {
      return Activity.Register
    }

    return Activity.Record
  }
}

/**
 * Get vaccination (session) outcome
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {VaccinationOutcome|PatientOutcome} Vaccination (session) outcome
 */
export const getSessionOutcome = (patientSession) => {
  if (patientSession.lastRecordedVaccination) {
    return patientSession.lastRecordedVaccination.outcome
  } else if (
    [ConsentOutcome.Refused, ConsentOutcome.FinalRefusal].includes(
      patientSession.consent
    )
  ) {
    return VaccinationOutcome.Refused
  } else if (patientSession.screen === ScreenOutcome.DoNotVaccinate) {
    return VaccinationOutcome.Contraindications
  }

  return PatientOutcome.NoOutcomeYet
}

/**
 * Get patient (programme) outcome
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @returns {PatientOutcome} Overall patient (programme) outcome
 */
export const getReportOutcome = (patientSession) => {
  if (patientSession.vaccinations?.length > 0) {
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
