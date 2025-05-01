import prototypeFilters from '@x-govuk/govuk-prototype-filters'

/**
 * kebab-case to PascalCase
 *
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
 *
 * @param {string} string - String to convert
 * @returns {string} kebab-case string
 */
export function pascalToKebabCase(string) {
  return string.replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Convert string to boolean
 *
 * @param {any} value - Value to test
 * @returns {boolean|any} Boolean
 */
export function stringToBoolean(value) {
  // Ensure single checkbox returns boolean not an array with _unchecked
  if (Array.isArray(value)) {
    value = value.filter((item) => item !== '_unchecked')[0]
  }

  return typeof value === 'string' ? value === 'true' : value
}

/**
 * Format highlight
 *
 * @param {string|number} string - String
 * @returns {string|undefined} Formatted HTML
 */
export function formatHighlight(string) {
  if (!string) return

  return `<mark class="app-highlight">${string}</mark>`
}

/**
 * Format link
 *
 * @param {string} href - Hyperlink reference
 * @param {string} text - Hyperlink text
 * @param {object} [attributes] - Hyperlink attributes
 * @returns {string} HTML anchor decorated with nhsuk-link class
 */
export function formatLink(href, text, attributes = {}) {
  const attrs = []

  const classes = [
    'nhsuk-link',
    ...(attributes.classes ? [attributes.classes] : [])
  ].join(' ')

  delete attributes.classes

  for (const [key, value] of Object.entries(attributes)) {
    if (value === true || value === 'true') {
      attrs.push(key)
    } else if (value !== undefined || value !== null || value !== false) {
      attrs.push(`${key}="${value}"`)
    }
  }

  return `<a class="${classes}" href="${href}"${attrs.join(' ')}>${text}</a>`
}

/**
 * Format link with optional secondary text
 *
 * @param {string} href - Hyperlink reference
 * @param {string} text - Hyperlink text
 * @param {string} [secondary] - Secondary text
 * @returns {string} Formatted HTML
 */
export function formatLinkWithSecondaryText(href, text, secondary) {
  let html = text

  if (href) {
    html = formatLink(href, text)
  }

  if (secondary) {
    html += `<br><span class="nhsuk-u-secondary-text-color nhsuk-u-font-size-16">${secondary}</span>`
  }

  return `<span>${html}</span>`
}

/**
 * Format text with optional secondary text
 *
 * @param {string} text - Primary text
 * @param {string} [secondary] - Secondary text
 * @returns {string} Formatted HTML
 */
export function formatWithSecondaryText(text, secondary) {
  let html = text

  if (secondary) {
    html += `<br><span class="nhsuk-u-secondary-text-color nhsuk-u-font-size-16">${secondary}</span>`
  }

  return `<span>${html}</span>`
}

/**
 * Format tag
 *
 * @param {object} options - Tag options
 * @param {string} [options.text] - Text
 * @param {string} [options.html] - Text
 * @param {string} [options.colour] - Colour
 * @param {string} [options.classes] - Classes
 * @returns {string} Formatted HTML
 */
export function formatTag({ text, html, colour, classes }) {
  text = html || text
  classes = ['nhsuk-tag', classes].join(' ')

  if (colour) {
    return `<strong class="${classes} nhsuk-tag--${colour}">${text}</strong>`
  }

  return `<strong class="${classes}">${text}</strong>`
}

/**
 * Format tag with optional secondary text
 *
 * @param {object} tag - Tag
 * @param {string} [secondary] - Secondary text
 * @returns {string} Formatted HTML
 */
export function formatTagWithSecondaryText(tag, secondary) {
  let html = formatTag(tag)

  if (secondary) {
    html += `<span class="nhsuk-u-secondary-text-color">${secondary}</span>`
  }

  return `<span>${html}</span>`
}

export function formatProgrammeStatus(programme, status, note) {
  let html = formatTag({
    classes: 'app-tag--attached',
    text: programme.name,
    colour: 'white'
  })

  if (status) {
    html += formatTag(status)
  }

  if (note) {
    html += `<span class="nhsuk-u-secondary-text-color">${note}</span>`
  }

  return html
}

/**
 * Format array as HTML list
 *
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
 *
 * @param {string} string - Markdown
 * @param {string} headingsStartWith - Initial heading size
 * @returns {string|undefined} HTML decorated with nhsuk-* classes
 */
export function formatMarkdown(string, headingsStartWith = 'l') {
  if (!string) return

  const markdown = prototypeFilters.govukMarkdown(string, {
    headingsStartWith
  })
  const nhsukMarkdown = String(markdown).replaceAll('govuk-', 'nhsuk-')

  return nhsukMarkdown
}

/**
 * Format millilitres
 *
 * @param {string|number} string - Amount
 * @returns {string|undefined} Formatted string
 */
export function formatMillilitres(string) {
  if (!string) return

  return `${string} ml`
}

/**
 * Format monospaced
 *
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
 *
 * @param {string} string - String
 * @param {boolean} invalid - Invalid record
 * @returns {string|undefined} Formatted HTML
 */
export function formatNhsNumber(string, invalid) {
  if (!string) return

  // Patients without an NHS number have a 10 character alphanumeric UID
  const isNhsNumber = string.match(/^\d{10}$/)

  if (isNhsNumber) {
    string = string
      .toString()
      .replaceAll(/(\d{3})(\d{3})(\d{4})/g, '$1&nbsp;&zwj;$2&nbsp;&zwj;$3')

    if (invalid) {
      string = `<s>${string}</s>`
    }

    return formatMonospace(string)
  }

  return null
}

/**
 * Format parent with optional display of telephone number
 *
 * @param {import('../models/parent.js').Parent} parent - Patent
 * @param {boolean} [includeTelephone] - Include telephone number
 * @returns {string|undefined} Formatted parent HTML
 */
export function formatParent(parent, includeTelephone = true) {
  if (!parent) return

  let string = parent.fullName || 'Parent or guardian'

  // Add relationship, if provided
  if (parent.fullName !== undefined && parent.relationship) {
    string += ` (${parent.relationship})`
  }

  // Add telephone number, if provided
  if (includeTelephone && parent.tel) {
    string += `<br><span class="nhsuk-u-secondary-text-color">${parent.tel}</span>`
  }

  return string
}

/**
 * Format parental relationship, falling back to name else unknown
 *
 * @param {import('../models/parent.js').Parent} parent - Patent
 * @returns {string|undefined} Formatted parent HTML
 */
export function formatParentalRelationship(parent) {
  if (!parent) return

  return parent.relationship || parent.fullName || 'Name unknown'
}

/**
 * Append other value, if one is provided
 *
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
 *
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

/**
 * Lower case first letter
 *
 * @param {string} string - String to change
 * @returns {string} String with lower cased first letter
 */
export function lowerCaseFirst(string) {
  return string.charAt(0).toLowerCase() + string.slice(1)
}
