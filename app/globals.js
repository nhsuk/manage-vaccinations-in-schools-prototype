import _ from 'lodash'

/**
 * Prototype specific global functions for use in Nunjucks templates.
 * @returns {object} Globals
 */
export default () => {
  const globals = {}

  /**
   * Get form field items for a given Enum
   * @param {Enum} Enum - Enumerable name
   * @returns {object} Form field items
   */
  globals.enumItems = function (Enum) {
    return Object.entries(Enum).map(([, value]) => ({
      text: value,
      value
    }))
  }

  /**
   * Format link
   * @param {string} href - Hyperlink reference
   * @param {string} text - Hyperlink text
   * @returns {string} HTML anchor decorated with nhsuk-link class
   */
  globals.link = function (href, text) {
    return `<a class="nhsuk-link" href="${href}">${text}</a>`
  }

  /**
   * Get summaryList `rows` parameters
   * @param {object} data - Data
   * @param {object} rows - Row configuration
   * @returns {object} `rows`
   */
  globals.summaryRows = function (data, rows) {
    const { __ } = this.ctx
    const summaryRows = []

    for (const key in rows) {
      let other = rows[key].other
      let value = rows[key].value || data[key]
      value = other ? [value, other].join(' – ') : value

      // Don’t show row for conditional answer
      if (typeof value === 'undefined') {
        continue
      }

      // Handle _unchecked checkbox value
      if (value === '_unchecked') {
        value = 'None selected'
      }

      // Handle falsy values
      if (value === false) {
        value = 'No'
      }

      // Handle truthy values
      if (value === true) {
        value = 'Yes'
      }

      const label = rows[key].label || __(`${data.ns}.${key}.label`)
      const changeLabel = rows[key].changeLabel || _.lowerFirst(label)
      const href = rows[key].href
      const fallbackValue = href
        ? `<a href="${href}">Add ${changeLabel}</a>`
        : 'Not provided'

      summaryRows.push({
        key: {
          text: label
        },
        value: {
          classes: rows[key]?.classes,
          html: value ? String(value) : fallbackValue
        },
        actions: href &&
          value && {
            items: [
              {
                href,
                text: 'Change',
                visuallyHiddenText: changeLabel
              }
            ]
          }
      })
    }

    return summaryRows
  }

  return globals
}
