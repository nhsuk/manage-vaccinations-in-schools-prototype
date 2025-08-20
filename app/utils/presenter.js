import _ from 'lodash'

import { en } from '../locales/en.js'

import { formatLink } from './string.js'

/**
 * Get human readable value
 *
 * @param {any} value
 * @returns {string|undefined} Human readable value
 */
const getValue = function (value) {
  if (typeof value !== 'undefined' && value !== 0 && value?.length !== 0) {
    // Handle _unchecked checkbox value
    if (value === '_unchecked') {
      return 'None selected'
    }

    // Handle falsy values
    if (value === false) {
      return 'No'
    }

    // Handle truthy values
    if (value === true) {
      return 'Yes'
    }

    return value
  }
}

/**
 * Get summary row
 *
 * @param {object} options - Options
 * @returns Summary row
 */
export const getSummaryRow = function (options) {
  const value = getValue(options.value)

  if (!value) {
    return
  }

  const { key, actions } = options
  const firstAction = actions?.[0]
  const changeLabel = firstAction?.changeLabel || _.lowerFirst(key)
  const fallbackValue = actions?.[0].href
    ? `<a href="${firstAction.href}">Add ${changeLabel}</a>`
    : 'Not provided'

  return {
    key: {
      text: key
    },
    value: {
      html: value ? String(value) : fallbackValue
    },
    actions: value && {
      items: actions?.map(
        (action) =>
          action.href && {
            href: action.href,
            text: action.changeText || en.actions.change,
            visuallyHiddenText: action.changeLabel || _.lowerFirst(key)
          }
      )
    }
  }
}

/**
 * Get table cell
 *
 * @param {object} options - Options
 * @returns Table cell
 */
export const getTableCell = function (options) {
  const value = getValue(options.value)

  if (!value) {
    return
  }

  return {
    header: options.key,
    html: value
      ? options.href
        ? formatLink(options.href, String(value))
        : String(value)
      : 'Not provided'
  }
}
