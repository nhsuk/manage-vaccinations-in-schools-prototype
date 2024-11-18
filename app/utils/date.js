import process from 'node:process'

import { formatISO, getDayOfYear, isAfter, isBefore, isEqual } from 'date-fns'

const ALLOWED_VALUES_FOR_MONTHS = [
  ['1', '01', 'jan', 'january'],
  ['2', '02', 'feb', 'february'],
  ['3', '03', 'mar', 'march'],
  ['4', '04', 'apr', 'april'],
  ['5', '05', 'may'],
  ['6', '06', 'jun', 'june'],
  ['7', '07', 'jul', 'july'],
  ['8', '08', 'aug', 'august'],
  ['9', '09', 'sep', 'september'],
  ['10', 'oct', 'october'],
  ['11', 'nov', 'november'],
  ['12', 'dec', 'december']
]

/**
 * Normalise month input as words to it’s number from 1 to 12
 *
 * @param {string} input - month in words or as a number with or without a leading 0
 * @returns {string|undefined} number of the month without a leading 0 or undefined
 */
function parseMonth(input) {
  if (input == null) return

  const trimmedLowerCaseInput = input.trim().toLowerCase()
  return ALLOWED_VALUES_FOR_MONTHS.find((month) =>
    month.find((allowedValue) => allowedValue === trimmedLowerCaseInput)
  )?.[0]
}

/**
 * Convert `govukDateInput` values into an ISO 8601 date.
 *
 * @param {object} object - Object containing date values
 * @param {string} [namePrefix] - `namePrefix` used for date values
 * @returns {string|undefined} ISO 8601 date string
 */
export function convertObjectToIsoDate(object, namePrefix) {
  let day, month, year, hour, minute

  if (namePrefix) {
    day = Number(object[`${namePrefix}-day`])
    month = Number(parseMonth(object[`${namePrefix}-month`])) - 1
    year = Number(object[`${namePrefix}-year`])
    hour = Number(object[`${namePrefix}-hour`])
    minute = Number(object[`${namePrefix}-minute`])
  } else {
    day = Number(object?.day)
    month = Number(parseMonth(object?.month)) - 1
    year = Number(object?.year)
    hour = Number(object?.hour) || 0
    minute = Number(object?.minute) || 0
  }

  try {
    if (!day) {
      return formatISO(new Date(year, month))
    }
    const ms = new Date().getMilliseconds()

    return formatISO(new Date(year, month, day, hour, minute, ms))
  } catch (error) {
    console.error(error.message.split(':')[0])
  }
}

/**
 * Convert ISO 8601 date to`items` object
 *
 * @param {string} isoDate - ISO 8601 date
 * @returns {object|undefined} `items` for dateInput component
 */
export function convertIsoDateToObject(isoDate) {
  if (!isoDate) return

  const dateObj = new Date(isoDate)

  return {
    year: String(dateObj.getFullYear()),
    month: String(dateObj.getMonth() + 1),
    day: String(dateObj.getDate()),
    hour: String(dateObj.getHours()),
    minute: String(dateObj.getMinutes()).padStart(2, '0'),
    seconds: String(dateObj.getSeconds()).padStart(2, '0')
  }
}

/**
 * Add days to a date
 *
 * @param {Date|string} isoDate - ISO 8601 date
 * @param {number} days - Number of days to add
 * @returns {Date} Date with days added
 */
export function addDays(isoDate, days) {
  const date = new Date(isoDate)
  date.setDate(date.getDate() + days)

  return date
}

/**
 * Remove days from a date
 *
 * @param {Date|string} isoDate - ISO 8601 date
 * @param {number} days - Number of days to remove
 * @returns {Date} Date with days removed
 */
export function removeDays(isoDate, days) {
  const date = new Date(isoDate)
  date.setDate(date.getDate() - days)

  return date
}

/**
 * Check if date lies between two other dates
 *
 * @param {Date|string} isoDate - ISO 8601 date to check
 * @param {Date|string} isoStartDate - ISO 8601 start date
 * @param {Date|string} isoEndDate - ISO 8601 end date
 * @returns {boolean} Date with days added
 */
export function isBetweenDates(isoDate, isoStartDate, isoEndDate) {
  return (
    (isAfter(isoDate, isoStartDate) || isEqual(isoDate, isoStartDate)) &&
    (isBefore(isoDate, isoEndDate) || isEqual(isoDate, isoEndDate))
  )
}

/**
 * Format a data
 *
 * @param {Date|string} date - Date string
 * @param {object} [options] - DateTimeFormat options
 * @returns {string|undefined} Formatted date
 */
export function formatDate(date, options) {
  if (!date) return

  date = new Date(date)

  return new Intl.DateTimeFormat('en-GB', options).format(date)
}

/**
 * Get age from date
 *
 * @param {string} isoDate - ISO 8601 date
 * @returns {number} Age
 */
export function getAge(isoDate) {
  const date = new Date(isoDate)

  return Math.floor((getToday().valueOf() - date.getTime()) / 3.15576e10)
}

/**
 * Set time to midday
 *
 * @param {Date} date - Date
 * @returns {Date} Date with time set to midday
 */
export function setMidday(date) {
  date.setUTCHours(12, 0, 0, 0)
  return date
}

/**
 * @param {Array} dates - Dates
 * @param {Date} date - Date
 * @returns {boolean} Dates includes date
 */
export function includesDate(dates, date) {
  return (
    dates.filter((item) => isEqual(getDayOfYear(item), getDayOfYear(date)))
      .length > 0
  )
}

/**
 * Get’s today’s date, as set by environment
 *
 * @param {number} [secondsToAdd] - Seconds to add
 * @returns {Date} ‘Today’s’ date
 */
export function getToday(secondsToAdd) {
  const now = new Date()

  if (process.env.TODAY) {
    const date = new Date(process.env.TODAY)
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()

    now.setFullYear(year)
    now.setMonth(month)
    now.setDate(day)
  }

  if (secondsToAdd) {
    now.setSeconds(now.getSeconds() + secondsToAdd)
  }

  return now
}

/**
 * Get school year group
 *
 * @param {string} isoDate - Date string
 * @returns {number} School year group
 */
export function getYearGroup(isoDate) {
  const date = new Date(isoDate)

  const today = getToday()
  const currentYear = today.getFullYear()

  const birthYear = date.getFullYear()
  const birthMonth = date.getMonth()
  const birthDay = date.getDate()

  // Calculate the age of the child on September 1 of the current year
  let ageOnStartOfYear = currentYear - birthYear

  if (birthMonth > 8 || (birthMonth === 8 && birthDay > 1)) {
    // If the birthday is after September 1, subtract 1 from the age
    ageOnStartOfYear -= 1
  }

  // Determine the year group
  return ageOnStartOfYear - 4
}
