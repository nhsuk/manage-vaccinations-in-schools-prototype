/**
 * kebab-case to PascalCase
 * @param {string} string - String to convert
 * @returns {string} PascalCase string
 */
export function kebabToPascalCase(string) {
  return string.replace(/(^\w|-\w)/g, (string) =>
    string.replace(/-/, '').toUpperCase()
  )
}

/**
 * PascalCase to kebab-case
 * @param {string} string - String to convert
 * @returns {string} kebab-case string
 */
export function pascalToKebabCase(string) {
  return string.replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Convert string to boolean
 * @param {any} value - Value to test
 * @returns {boolean|any} Boolean
 */
export function stringToBoolean(value) {
  return typeof value === 'string' ? value === 'true' : value
}

/**
 * Format millilitres
 * @param {string|number} string - Amount
 * @returns {string|undefined} Formatted string
 */
export function formatMillilitres(string) {
  if (!string) return

  return `${string} ml`
}

/**
 * Format monospaced
 * @param {string|number} string - String
 * @returns {string|undefined} Formatted HTML
 */
export function formatMonospace(string) {
  if (!string) return

  return `<span class="app-u-monospace">${string}</span>`
}
