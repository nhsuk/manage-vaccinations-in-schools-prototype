import { Notice } from '../models.js'

/**
 * Generate fake notice
 *
 * @param {import('../models.js').Patient} patient - Patient
 * @param {import('../enums.js').NoticeType} type - Notice type
 * @returns {Notice} Notice
 */
export function generateNotice(patient, type) {
  return new Notice({
    type,
    patient_uuid: patient?.uuid
  })
}
