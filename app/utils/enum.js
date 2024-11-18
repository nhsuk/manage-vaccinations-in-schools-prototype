/**
 * Get an enum key value pair
 *
 * @param {object} enums - Enum to search
 * @param {string} enumValue - Value to find
 * @returns {object} Enum key value pair
 */
export function getEnumKeyAndValue(enums, enumValue) {
  const [key, value] =
    Object.entries(enums).find(([, value]) => value === enumValue) || []
  return { key, value }
}
