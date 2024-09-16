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
 * Format highlight
 * @param {string|number} string - String
 * @returns {string|undefined} Formatted HTML
 */
export function formatHighlight(string) {
  if (!string) return

  return `<mark class="app-highlight">${string}</mark>`
}

/**
 * Format link
 * @param {string} href - Hyperlink reference
 * @param {string} text - Hyperlink text
 * @param {object} [attributes] - Hyperlink attributes
 * @returns {string} HTML anchor decorated with nhsuk-link class
 */
export function formatLink(href, text, attributes = {}) {
  let attrs = []

  for (const [key, value] of Object.entries(attributes)) {
    if (value === true || value === 'true') {
      attrs.push(key)
    } else if (value !== undefined || value !== null || value !== false) {
      attrs.push(`${key}="${value}"`)
    }
  }
  attrs = attrs.join(' ')

  return `<a class="nhsuk-link" href="${href}"${attrs}>${text}</a>`
}

/**
 * Format array as HTML list
 * @param {Array} array - Array
 * @returns {string|undefined} HTML unordered list with nhsuk-* classes
 */
export function formatList(array) {
  if (!Array.isArray(array)) {
    return array
  }

  // Only use list if more than one item in array
  if (array.length === 1) {
    return array[0]
  }

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
 * Format monospaced
 * @param {string|number} string - String
 * @returns {string|undefined} Formatted HTML
 */
export function formatMonospace(string) {
  if (!string) return

  return `<span class="app-u-monospace">${string}</span>`
}

/**
 * Format NHS number
 * Replace each space in number with a non-breaking space and zero-width word
 * joiner to prevent telephone format detection
 * @param {string|number} string - String
 * @returns {string|undefined} Formatted HTML
 */
export function formatNhsNumber(string) {
  if (!string) return

  // Patients without an NHS number have a 10 character alphanumeric UID
  const isNhsNumber = string.match(/^\d{10}$/)

  if (isNhsNumber) {
    string = string
      .toString()
      .replaceAll(/(\d{3})(\d{4})(\d{3})/g, '$1&nbsp;&zwj;$2&nbsp;&zwj;$3')

    return formatMonospace(string)
  }

  return null
}

/**
 * Format parent with optional display of telephone number
 * @param {import('../models/reply.js').Parent} parent - Patent
 * @returns {string|undefined} Formatted parent HTML
 */
export function formatParent(parent) {
  if (!parent) return

  let string = `${parent.fullName} (${parent.relationship})`
  if (parent.tel) {
    string += `<br><span class="nhsuk-u-secondary-text-color">${parent.tel}</span>`
  }

  return string
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

/**
 * Format year group
 * @param {number} yearGroup - Year group
 * @returns {string} Formatted year group
 */
export function formatYearGroup(yearGroup) {
  switch (true) {
    case yearGroup === 0:
      return 'Reception'
    case yearGroup < 0:
      return 'Nursery'
    default:
      return `Year ${yearGroup}`
  }
}
