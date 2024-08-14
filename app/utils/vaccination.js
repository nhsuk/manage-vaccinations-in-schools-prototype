import { Record } from '../models/record.js'
import { Vaccination } from '../models/vaccination.js'

/**
 * Get full vaccination record
 * @param {object} data - Session data
 * @param {Array<string>} uuids - Vaccination UUIDS
 * @returns {Array<import('../models/vaccination.js').Vaccination>} Vaccinations
 */
export const getVaccinations = (data, uuids) => {
  const vaccinations = []
  for (const uuid of uuids) {
    const vaccination = new Vaccination(data.vaccinations[uuid])

    // Add patient record to vaccination record
    vaccination.record = new Record(
      data.patients[vaccination.patient_uuid].record
    )

    vaccinations.push(vaccination)
  }

  return vaccinations
}
