import { Notice } from '../models/notice.js'

/**
 * Generate fake notice
 *
 * @param {import('../models/patient.js').Patient} patient - Patient
 * @param {import('../enums.js').NoticeType} type - Notice type
 * @returns {Notice} - Notice
 */
export function generateNotice(patient, type) {
  return new Notice({
    type,
    patient_uuid: patient?.uuid
  })
}
