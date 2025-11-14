import programmesData from '../datasets/programmes.js'
import { Programme } from '../models/programme.js'
import { formatProgrammeId } from '../utils/string.js'

/**
 * Generate fake programme
 *
 * @param {string} type - Programme type
 * @param {number} year - Academic year
 * @returns {Programme} Programme
 */
export function generateProgramme(type, year) {
  const programme = {
    ...programmesData[type],
    id: formatProgrammeId(type, year),
    year
  }

  return new Programme(programme)
}
