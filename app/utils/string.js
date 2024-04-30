/**
 * Convert string to boolean
 * @param {any} value - Value to test
 * @returns {boolean|any} Boolean
 */
export function stringToBoolean(value) {
  return typeof value === 'string' ? value === 'true' : value
}
