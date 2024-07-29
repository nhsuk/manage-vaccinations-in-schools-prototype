import prototypeFilters from '@x-govuk/govuk-prototype-filters'

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
 * Format link
 * @param {string} href - Hyperlink reference
 * @param {string} text - Hyperlink text
 * @returns {string} HTML anchor decorated with nhsuk-link class
 */
export function formatLink(href, text) {
  return `<a class="nhsuk-link" href="${href}">${text}</a>`
}

/**
 * Format array as HTML list
 * @param {Array} array - Array
 * @returns {string|undefined} HTML unordered list with nhsuk-* classes
 */
export function formatList(array) {
  if (!Array.isArray(array)) return

  const list = array.map((item) => `- ${item}`)
  return formatMarkdown(list.join('\n'))
}

/**
 * Format markdown
 * @param {string} string - Markdown
 * @returns {string|undefined} HTML decorated with nhsuk-* classes
 */
export function formatMarkdown(string) {
  if (!string) return

  const markdown = prototypeFilters.govukMarkdown(string, {
    headingsStartWith: 'l'
  })
  const nhsukMarkdown = markdown.replaceAll('govuk-', 'nhsuk-')

  return nhsukMarkdown
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
 * Format highlight
 * @param {string|number} string - String
 * @returns {string|undefined} Formatted HTML
 */
export function formatHighlight(string) {
  if (!string) return

  return `<mark class="app-highlight">${string}</mark>`
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

/**
 * Append other value, if one is provided
 * @param {string} other - Other option name (typically ‘Other’)
 * @param {string} string - Other value
 * @returns {string|undefined} Full other value
 */
export function formatOther(other, string) {
  if (!other) return

  return other ? [string, other].join(' – ') : string
}
