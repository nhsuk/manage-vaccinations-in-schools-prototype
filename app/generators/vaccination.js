import { fakerEN_GB as faker } from '@faker-js/faker'

import vaccines from '../datasets/vaccines.js'
import { ConsentOutcome, ScreenOutcome } from '../models/patient-session.js'
import { Vaccination, VaccinationOutcome } from '../models/vaccination.js'

/**
 * Generate fake vaccination
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {import('../models/session.js').Session} session - Session
 * @param {import('../models/batch.js').Batch} batch - Batch
 * @param {Array<import('../models/user.js').User>} users - Users
 * @returns {Vaccination} - Vaccination
 */
export function generateVaccination(
  patientSession,
  programme,
  session,
  batch,
  users
) {
  const user = faker.helpers.arrayElement(users)

  let injectionMethod
  let injectionSite
  let sequence

  let outcome
  if (patientSession.screen === ScreenOutcome.DoNotVaccinate) {
    outcome = VaccinationOutcome.Contraindications
  } else if (patientSession.consent === ConsentOutcome.Given) {
    outcome = faker.helpers.weightedArrayElement([
      { value: VaccinationOutcome.Vaccinated, weight: 7 },
      { value: VaccinationOutcome.PartVaccinated, weight: 1 },
      { value: VaccinationOutcome.Refused, weight: 1 },
      { value: VaccinationOutcome.Absent, weight: 1 },
      { value: VaccinationOutcome.Unwell, weight: 1 }
    ])
  } else {
    outcome = VaccinationOutcome.NoConsent
  }

  if (programme.sequence) {
    sequence = programme.sequenceDefault
  }

  const vaccinated =
    outcome === VaccinationOutcome.Vaccinated ||
    outcome === VaccinationOutcome.PartVaccinated

  return new Vaccination({
    createdAt: session.firstDate,
    createdBy_uid: user.uid,
    outcome,
    location: session.location.name,
    selfId: true,
    programme_id: programme.id,
    session_id: session.id,
    patient_uuid: patientSession.patient.uuid,
    vaccine_snomed: batch.vaccine_snomed,
    ...(vaccinated && {
      batch_id: batch.id,
      dose: vaccines[batch.vaccine_snomed].dose,
      sequence,
      injectionMethod,
      injectionSite
    })
  })
}
