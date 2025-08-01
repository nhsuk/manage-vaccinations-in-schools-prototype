import prototypeFilters from '@x-govuk/govuk-prototype-filters'

import { healthQuestions } from '../datasets/health-questions.js'

/**
 * kebab-case to camelCase
 *
 * @param {string} string - String to convert
 * @returns {string} camelCase string
 */
export function kebabToCamelCase(string) {
  return string
    .replace(/(^\w|-\w)/g, (match) => match.replace(/-/, '').toUpperCase())
    .replace(/^./, (match) => match.toLowerCase())
}

/**
 * camelCase to kebab-case
 *
 * @param {string} string - String to convert
 * @returns {string} kebab-case string
 */
export function camelToKebabCase(string) {
  return string.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
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
 * Convert string to array
 *
 * @param {any} value - Value to test
 * @returns {Array} Array
 */
export function stringToArray(value) {
  const array = Array.isArray(value) ? value : []
  return array.filter((item) => item !== '_unchecked')
}

/**
 * Format highlight
 *
 * @param {object} healthAnswer - Health answer
 * @param {string} healthAnswer.answer - Yes/No
 * @param {string} healthAnswer.details - Details for yes answer
 * @param {string} [healthAnswer.relationship] - Relationship of respondent
 * @returns {string|Promise<string>} Formatted HTML
 */
export function formatHealthAnswer({ answer = 'No', details, relationship }) {
  let html = relationship
    ? prototypeFilters.govukMarkdown(
        [relationship, answer].join(' responded: ')
      )
    : prototypeFilters.govukMarkdown(answer)

  if (answer === 'Yes' && details) {
    html += `\n<blockquote>${String(prototypeFilters.govukMarkdown(details)).replaceAll('govuk-', 'nhsuk-')}</blockquote>`
  }

  return html
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
 * @param {boolean} [breakLine=true] - Whether to add a line break before secondary text
 * @returns {string} Formatted HTML
 */
export function formatWithSecondaryText(text, secondary, breakLine = true) {
  let html = text

  if (secondary) {
    html += breakLine ? '<br>' : ''
    html += `<span class="nhsuk-u-secondary-text-color nhsuk-u-font-size-16">${secondary}</span>`
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

export function formatHealthQuestions(questions) {
  const items = Object.entries(questions).map(([key, question]) => {
    if (!question.conditional) {
      return `- ${healthQuestions[key].label}`
    }

    const subList = Object.keys(question.conditional)
      .map((conditionalKey) => `  - ${healthQuestions[conditionalKey].label}`)
      .join('\n')
    return `- ${healthQuestions[key].label}\n${subList}`
  })

  return formatMarkdown(items.join('\n'))
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
    return formatMarkdown(array[0])
  } else if (array.length > 1) {
    const list = array.map((item) => `- ${item}`)
    return formatMarkdown(list.join('\n'))
  }

  return ''
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
  const nhsukMarkdown = String(markdown)
    .replaceAll('govuk-', 'nhsuk-')
    .replaceAll('-!-', '-u-')

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
 * @param {boolean} [noWrap=false] - Prevent wrapping
 * @returns {string|undefined} Formatted HTML
 */
export function formatMonospace(string, noWrap = false) {
  if (!string) return

  const classes = ['app-u-monospace']

  if (noWrap) {
    classes.push('nhsuk-u-nowrap')
  }

  return `<span class="${classes.join(' ')}">${string}</span>`
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
    string = string.toString().replaceAll(/(\d{3})(\d{3})(\d{4})/g, '$1 $2 $3')

    if (invalid) {
      string = `<s>${string}</s>`
    }

    return formatMonospace(string, true)
  }

  return null
}

/**
 * Format parent with optional display of telephone number
 *
 * @param {import('../models/parent.js').Parent} parent - Parent
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
 * Format programme ID
 *
 * @param {string} type - Programme type
 * @param {import('../enums.js').AcademicYear} year - Academic year
 * @returns {string} Programme ID
 */
export function formatProgrammeId(type, year) {
  type = camelToKebabCase(type).replace('/', '-')
  year = year.split(' ')[0]

  return `${type}-${year}`
}

/**
 * Format identifier
 *
 * @param {object} identifiedBy - Identifier
 * @returns {string|undefined} Formatted identifier HTML
 */
export function formatIdentifier(identifiedBy) {
  if (!identifiedBy) return

  let string = identifiedBy.name

  // Add relationship, if provided
  if (identifiedBy.name !== undefined && identifiedBy.relationship) {
    string += ` (${identifiedBy.relationship})`
  }

  return string
}

/**
 * Format parental relationship, falling back to name else unknown
 *
 * @param {import('../models/parent.js').Parent} parent - Parent
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
 * Format vaccine method
 *
 * @param {string} string - String
 * @returns {string} Formatted HTML
 */
export function formatVaccineMethod(string) {
  if (!string) return

  return `<span class="app-vaccine-method" data-method="${string}">${string}</span>`
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

/**
 * Get programme names that can be used in a sentence
 *
 * @param {string} string - String to change
 * @returns {string} Sentence cased programme names
 */
export function sentenceCaseProgrammeName(string) {
  if (!string) return

  return string
    .replaceAll('Children', 'children') // Children’s flu vaccine
    .replaceAll('Flu', 'flu') // Flu vaccination
    .replaceAll('Human', 'human') // Human papillomavirus
}
