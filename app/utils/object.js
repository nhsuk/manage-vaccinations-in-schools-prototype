import _ from 'lodash'

/**
 * Convert an object to a Map
 *
 * @param {object|Map} object - Object
 * @returns {Map} Mapped object
 */
export function createMap(object) {
  return object instanceof Map ? object : new Map(Object.entries(object))
}

/**
 * Tokenize selected keys in an object
 *
 * @param {object} object - Object to tokenize
 * @param {Array} keys - Keys to tokenize
 * @returns {string} Tokens
 */
export function tokenize(object, keys) {
  const values = keys
    .map((key) => _.get(object, key))
    .filter((value) => value !== undefined && value !== null)
    .map((value) => value.toLowerCase())

  return values.join(' ')
}
