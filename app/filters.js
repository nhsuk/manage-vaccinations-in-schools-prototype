import _ from 'lodash'
import { formatDate } from './utils/date.js'
import {
  formatHighlight,
  formatList,
  formatMarkdown,
  formatYearGroup
} from './utils/string.js'

/**
 * Prototype specific filters for use in Nunjucks templates.
 * @param {object} env - Nunjucks environment
 * @returns {object} Filters
 */
export default (env) => {
  const filters = {}

  /**
   * Format date
   * @param {string} string - ISO date, for example 07-12-2021
   * @param {Intl.DateTimeFormatOptions} options - Options
   * @returns {string} Formatted date, for example Sunday, 7 December 2021
   */
  filters.date = (string, options) => {
    return formatDate(string, options)
  }

  /**
   * Convert div.nhsuk-card to form.nhsuk-card
   * @param {string} string - HTML
   * @returns {string} Formatted HTML
   */
  filters.formCard = function (string) {
    const { filters } = this.ctx.settings.nunjucksEnv
    const html = string
      .replace(
        /^\n\n\n\n<div class="nhsuk-card/,
        '<form method="post" class="nhsuk-card'
      )
      .replace(/<\/div>\n$/, '</form>')

    return filters.safe(html)
  }

  /**
   * Convert div.nhsuk-card to button.nhsuk-card
   * @param {string} string - HTML
   * @returns {string} Formatted HTML
   */
  filters.buttonCard = function (string) {
    const { filters } = this.ctx.settings.nunjucksEnv
    const html = string
      .replace(
        /^\n\n\n\n<div class="nhsuk-card/,
        '<button class="nhsuk-card nhsuk-card--button'
      )
      .replace(/<\/div>\n$/, '</button>')

    return filters.safe(html)
  }

  /**
   * Convert govuk-summary-card to nhsuk-card containing a summary list
   * @param {string} string - HTML
   * @returns {string} Formatted HTML
   */
  filters.summaryCard = function (string) {
    const { filters } = this.ctx.settings.nunjucksEnv
    const html = string
      .replaceAll(/govuk-summary-card/g, 'nhsuk-card')
      .replaceAll('nhsuk-card__title', 'app-card__title')
      .replaceAll('nhsuk-card__actions', 'app-action-list')
      .replaceAll('nhsuk-card__action', 'app-action-list__item')
      .replaceAll('govuk-summary-list', 'nhsuk-summary-list')
      .replaceAll('govuk-link', 'nhsuk-link')

    return filters.safe(html)
  }

  /**
   * Highlight difference
   * @param {string} a - Value in consent response
   * @param {string} b - Value in patient record
   * @returns {string} Value, wrapped in <mark> if different
   */
  filters.highlightDifference = (a, b) => {
    if (a !== b) {
      return env.filters.safe(formatHighlight(a))
    }

    return a
  }

  /**
   * Format markdown
   * @param {string} string - Markdown
   * @returns {string} HTML decorated with nhsuk-* typography classes
   */
  filters.nhsukMarkdown = (string) => {
    return env.filters.safe(formatMarkdown(string))
  }

  /**
   * Format array as HTML list
   * @param {Array} array - Array
   * @returns {string} HTML unordered list with nhsuk-* typography classes
   */
  filters.nhsukList = function (array) {
    return env.filters.safe(formatList(array))
  }

  /**
   * Format year group
   * @param {number} number - Year group
   * @returns {string} Formatted year group
   */
  filters.yearGroup = function (number) {
    return env.filters.safe(formatYearGroup(number))
  }

  /**
   * Remove last element from an array
   * @param {Array} array - Array
   * @returns {Array} Updated array
   */
  filters.pop = (array) => {
    array.pop()

    return array
  }

  /**
   * Push item to array
   * @param {Array} array - Array
   * @param {*} item - Item to push
   * @returns {Array} Updated array
   */
  filters.push = (array, item) => {
    let newArray = [...array]
    newArray.push(_.cloneDeep(item))

    return newArray
  }

  /**
   * Filter array where key has a value
   * @param {Array} array - Array
   * @param {string} key - Key to check
   * @param {string} value - Value to check
   * @returns {Array} Filtered array
   */
  filters.where = (array, key, value) => {
    return array.filter((item) => _.get(item, key) === value)
  }

  return filters
}
