import { VaccinationOutcome, VaccinationSyncStatus } from '../enums.js'

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
