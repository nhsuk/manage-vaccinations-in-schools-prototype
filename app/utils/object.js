/**
 * Convert an object to a Map
 *
 * @param {object|Map} object - Object
 * @returns {Map} Mapped object
 */
export function createMap(object) {
  return object instanceof Map ? object : new Map(Object.entries(object))
}
