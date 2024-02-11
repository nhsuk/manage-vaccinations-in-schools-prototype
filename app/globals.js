import _ from 'lodash'

/**
 * Prototype specific global functions for use in Nunjucks templates.
 * @returns {object} Globals
 */
export default () => {
  const globals = {}

  /**
   * Get form field items for a given Enum
   * @param {Enum} Enum
   * @returns Form field items
   */
  globals.enumItems = function (Enum) {
    return Object.entries(Enum).map(([key, value]) => ({
      text: value,
      value: key
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
   * Session summary
   * @param {object} session - Session details
   * @returns {string} HTML paragraph
   */
  globals.sessionSummary = function (session) {
    return `<p class="nhsuk-u-margin-bottom-0 nhsuk-u-secondary-text-color">
      ${globals.link(session.uri, session.location.name)}</br>
      ${session.location.addressLine1},
      ${session.location.addressLevel1},
      ${session.location.postalCode}
    </p>`
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
      const value = rows[key].value || data[key]

      // Don’t show row for conditional answer
      if (typeof value === 'undefined') {
        continue
      }

      const label = rows[key].label || __(`${data.ns}.${key}.label`)
      const changeLabel = _.lowerFirst(label)
      const href = rows[key].href
      const fallbackValue = href
        ? `<a href="${href}">Enter ${changeLabel}</a>`
        : 'Not provided'

      summaryRows.push({
        key: {
          text: label
        },
        value: {
          html: String(value) || fallbackValue
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
