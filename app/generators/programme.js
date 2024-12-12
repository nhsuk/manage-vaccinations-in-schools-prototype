import { Programme } from '../models/programme.js'

/**
 * Generate fake programme
 *
 * @param {string} type - Type
 * @returns {Programme} - Programme
 */
export function generateProgramme(type) {
  return new Programme({ type })
}
