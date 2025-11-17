import {
  SessionStatus,
  UploadStatus,
  VaccinationOutcome,
  VaccinationSyncStatus
} from '../enums.js'

/**
 * Get session status properties
 *
 * @param {SessionStatus} status - Session status
 * @returns {object} Status properties
 */
export function getSessionStatus(status) {
  let colour
  switch (status) {
    case SessionStatus.Closed:
      colour = 'red'
      break
    case SessionStatus.Completed:
      colour = 'green'
      break
    case SessionStatus.Unplanned:
      colour = 'purple'
      break
    default:
      colour = 'blue'
  }

  return {
    colour,
    text: status
  }
}

/**
 * Get upload status properties
 *
 * @param {UploadStatus} status - Upload status
 * @returns {object} Status properties
 */
export function getUploadStatus(status) {
  let colour
  switch (status) {
    case UploadStatus.Approved:
      colour = 'green'
      break
    case UploadStatus.Review:
      colour = 'blue'
      break
    case UploadStatus.Devoid:
      colour = 'grey'
      break
    case UploadStatus.Failed:
    case UploadStatus.Invalid:
      colour = 'red'
      break
    default:
      colour = 'white'
  }

  return {
    colour,
    text: status
  }
}

/**
 * Get vaccination sync status properties
 *
 * @param {VaccinationSyncStatus} syncStatus - Vaccination sync status
 * @returns {object} Status properties
 */
export function getVaccinationSyncStatus(syncStatus) {
  let colour
  switch (syncStatus) {
    case VaccinationSyncStatus.CannotSync:
      colour = 'orange'
      break
    case VaccinationSyncStatus.NotSynced:
      colour = 'grey'
      break
    case VaccinationSyncStatus.Synced:
      colour = 'green'
      break
    case VaccinationSyncStatus.Failed:
      colour = 'red'
      break
    default:
      colour = 'blue'
  }

  return {
    colour,
    text: syncStatus
  }
}

/**
 * Get vaccination outcome status properties
 *
 * @param {VaccinationOutcome} outcome - Vaccination outcome
 * @returns {object} Status properties
 */
export function getVaccinationOutcomeStatus(outcome) {
  let colour
  switch (outcome) {
    case VaccinationOutcome.Vaccinated:
    case VaccinationOutcome.PartVaccinated:
    case VaccinationOutcome.AlreadyVaccinated:
      colour = 'green'
      break
    default:
      colour = 'dark-orange'
  }

  return {
    colour,
    text: outcome
  }
}
