import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import _ from 'lodash'

import { HealthQuestion } from './models/vaccine.js'
import { formatLink, formatParent, pascalToKebabCase } from './utils/string.js'

/**
 * Prototype specific global functions for use in Nunjucks templates.
 *
 * @returns {object} Globals
 */
export default () => {
  const globals = {}

  /**
   * Get boolean form field items
   *
   * @returns {object} Form field items
   */
  globals.booleanItems = [
    { text: 'Yes', value: true },
    { text: 'No', value: false }
  ]

  /**
   * Get form field items for a given Enum
   *
   * @param {object} Enum - Enumerable name
   * @returns {object} Form field items
   */
  globals.enumItems = function (Enum) {
    return Object.entries(Enum).map(([, value]) => ({
      text: value,
      value
    }))
  }

  /**
   * Get form field items for a given outcome Enum
   *
   * @param {object} Enum - Enumerable name
   * @param {string} selected - Selected value
   * @returns {object} Form field items
   */
  globals.outcomeItems = function (Enum, selected) {
    return [
      {
        text: 'Any',
        value: 'none',
        checked: !selected || selected === 'none'
      },
      ...Object.values(Enum).map((value) => ({
        text: value,
        value,
        checked: value === selected
      }))
    ]
  }

  /**
   * Convert errors object to array for errorSummary component
   *
   * @param {object} errors - Error messages
   * @returns {Array} Error list
   */
  globals.errorList = function (errors) {
    const errorsList = []

    for (const [key, value] of Object.entries(errors)) {
      errorsList.push({
        text: value,
        href: `#${key}`
      })
    }

    return errorsList
  }

  /**
   * Get health answers for summary list rows
   *
   * @param {object} healthAnswers - Health answers
   * @param {string} edit - Edit link
   * @returns {Array|undefined} Parameters for summary list component
   */
  globals.healthAnswerRows = function (healthAnswers, edit) {
    if (healthAnswers.length === 0) {
      return
    }

    const rows = []
    for (const [id, value] of Object.entries(healthAnswers)) {
      let html = ''
      if (typeof value === 'object') {
        // Answers across all replies
        // Show the relationship of person of answered, as well as their answer
        for (const [relationship, answer] of Object.entries(value)) {
          html += answer
            ? `<p>${relationship} responded: Yes:</p>\n<blockquote>${answer}</blockquote>`
            : `<p>${relationship} responded: No<p>`
        }
      } else {
        // Answer in reply
        // Only show the answer
        html += value
          ? `<p>Yes:</p>\n<blockquote>${String(prototypeFilters.govukMarkdown(value)).replaceAll('govuk-', 'nhsuk-')}</blockquote>`
          : `<p>No<p>`
      }

      const key = pascalToKebabCase(id)

      rows.push({
        key: { text: HealthQuestion[id] },
        value: { html },
        ...(edit && {
          actions: {
            items: [
              {
                href: edit.replace(`{{key}}`, key),
                text: 'Change',
                visuallyHiddenText: HealthQuestion[id]
              }
            ]
          }
        })
      })
    }

    return rows
  }

  globals.inspect = function (data, includeContext = false) {
    const { filters } = this.ctx.settings.nunjucksEnv

    if (!includeContext) {
      const contextlessData = structuredClone(data)
      delete contextlessData.context
      data = contextlessData
    }

    const json = JSON.stringify(data, null, 2)
    return filters.safe(`<pre>${json}</pre>`)
  }

  /**
   * Format link
   *
   * @param {string} href - Hyperlink reference
   * @param {string} text - Hyperlink text
   * @param {object} [attributes] - Hyperlink attributes
   * @returns {string} HTML anchor decorated with nhsuk-link class
   */
  globals.link = function (href, text, attributes) {
    return formatLink(href, text, attributes)
  }

  globals.parent = function (parent) {
    return formatParent(parent)
  }

  /**
   * Get percentage of two numbers
   *
   * @param {number} total - Total
   * @param {number} number - Number of total
   * @returns {number} Formatted HTML
   */
  globals.percentage = function (total, number) {
    const percentage = (total / number) * 100
    return Math.round(percentage)
  }

  /**
   * Show health questions
   *
   * @param {import('./models/programme.js').Programme} programme - Programme
   * @returns {object|undefined} Health questions
   */
  globals.healthQuestions = function (programme) {
    if (!programme) {
      return
    }

    return Object.entries(programme.vaccine.healthQuestions).map(
      ([key, question]) => {
        key = Object.keys(HealthQuestion).find(
          (key) => HealthQuestion[key] === question
        )

        return [key, question]
      }
    )
  }

  /**
   * Get tag parameters
   *
   * @param {object} status - Status
   * @param {string} [status.text] - Status text
   * @param {string} [status.html] - Status HTML
   * @param {string} [status.colour] - Status colour
   * @returns {object} Parameters
   */
  globals.statusTag = function ({ text, html, colour }) {
    return {
      text,
      html,
      ...(colour && { classes: `nhsuk-tag--${colour}` })
    }
  }

  /**
   * Get summaryList `rows` parameters
   *
   * @param {object} data - Data
   * @param {object} rows - Row configuration
   * @returns {object} `rows`
   */
  globals.summaryRows = function (data, rows) {
    const { __ } = this.ctx
    const summaryRows = []

    for (const key in rows) {
      // Formatted value may be an empty string, so only check for `undefined`
      let formattedValue
      if (data?.formatted?.[key] !== undefined) {
        formattedValue = data.formatted[key]
      } else {
        formattedValue = data[key]
      }

      // Allow value to be explicitly set
      let value = rows[key]?.value || formattedValue

      if (typeof value !== 'undefined' && value !== 0 && value?.length !== 0) {
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
        const changeText = rows[key].changeText || __(`actions.change`)
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
                  text: changeText,
                  visuallyHiddenText: changeLabel
                }
              ]
            }
        })
      }
    }

    return summaryRows
  }

  return globals
}
