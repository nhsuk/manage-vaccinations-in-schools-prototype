import { fakerEN_GB as faker } from '@faker-js/faker'

import vaccines from '../datasets/vaccines.js'
import { ConsentOutcome } from '../models/patient.js'
import { Vaccination, VaccinationOutcome } from '../models/vaccination.js'

/**
 * Generate fake vaccination
 *
 * @param {import('../models/patient.js').Patient} patient - Patient
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {import('../models/session.js').Session} session - Session
 * @param {import('../models/batch.js').Batch} batch - Batch
 * @param {Array<import('../models/user.js').User>} users - Users
 * @returns {Vaccination} - Vaccination
 */
export function generateVaccination(patient, programme, session, batch, users) {
  const user = faker.helpers.arrayElement(users)

  let injectionMethod
  let injectionSite
  let sequence

  let outcome
  if (patient.consent.value === ConsentOutcome.Given) {
    outcome = faker.helpers.weightedArrayElement([
      { value: VaccinationOutcome.Vaccinated, weight: 7 },
      { value: VaccinationOutcome.PartVaccinated, weight: 1 },
      { value: VaccinationOutcome.Refused, weight: 1 }
    ])
  } else {
    outcome = VaccinationOutcome.NoConsent
  }

  const vaccinated =
    outcome === VaccinationOutcome.Vaccinated ||
    outcome === VaccinationOutcome.PartVaccinated

  return new Vaccination({
    created: session.firstDate,
    created_user_uid: user.uid,
    outcome,
    location: session.location.name,
    programme_pid: programme.pid,
    session_id: session.id,
    patient_uuid: patient.uuid,
    vaccine_gtin: batch.vaccine_gtin,
    ...(vaccinated && {
      batch_id: batch.id,
      dose: vaccines[batch.vaccine_gtin].dose,
      sequence,
      injectionMethod,
      injectionSite
    })
  })
}