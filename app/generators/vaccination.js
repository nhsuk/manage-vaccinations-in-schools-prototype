import { fakerEN_GB as faker } from '@faker-js/faker'

import vaccines from '../datasets/vaccines.js'
import { ConsentOutcome, ScreenOutcome, VaccinationOutcome } from '../enums.js'
import { Vaccination } from '../models/vaccination.js'

/**
 * Generate fake vaccination
 *
 * @param {import('../models/patient-session.js').PatientSession} patientSession - Patient session
 * @param {import('../models/programme.js').Programme} programme - Programme
 * @param {import('../models/batch.js').Batch} batch - Batch
 * @param {Array<import('../models/user.js').User>} users - Users
 * @returns {Vaccination} - Vaccination
 */
export function generateVaccination(patientSession, programme, batch, users) {
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

  // Sync date is between 1 minute and 2 hours after the session first date
  const syncDateLowerBound = new Date(
    patientSession.session.firstDate.getTime() + 1000 * 60
  )
  const syncDateUpperBound = new Date(
    patientSession.session.firstDate.getTime() + 1000 * 60 * 60 * 2
  )

  // Only populate sync date if the patient was vaccinated
  const nhseSyncedAt = vaccinated
    ? faker.helpers.maybe(
        () =>
          faker.date.between({
            from: syncDateLowerBound,
            to: syncDateUpperBound
          }),
        { probability: 0.9 }
      )
    : undefined

  return new Vaccination({
    createdAt: patientSession.session.firstDate,
    createdBy_uid: user.uid,
    nhseSyncedAt,
    outcome,
    location: patientSession.session.location.name,
    selfId: true,
    programme_id: programme.id,
    patientSession_uuid: patientSession.uuid,
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
