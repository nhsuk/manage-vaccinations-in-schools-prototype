import _ from 'lodash'
import prototypeFilters from '@x-govuk/govuk-prototype-filters'

/**
 * Prototype specific filters for use in Nunjucks templates.
 * @param {object} env - Nunjucks environment
 * @returns {object} Filters
 */
export default (env) => {
  const filters = {}

  /**
   * Format markdown
   * @param {string} string - Markdown
   * @returns {string|undefined} HTML decorated with nhsuk-* typography classes
   */
  filters.nhsukMarkdown = (string) => {
    if (!string) return

    const markdown = prototypeFilters.govukMarkdown(string)
    const nhsukMarkdown = markdown.replaceAll('govuk-', 'nhsuk-')
    return env.filters.safe(nhsukMarkdown)
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

  return filters
}
