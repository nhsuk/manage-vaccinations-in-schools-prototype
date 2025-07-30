import process from 'node:process'

import { getDayOfYear, isAfter, isBefore, isEqual } from 'date-fns'

import { AcademicYear } from '../enums.js'

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
 * @returns {Date|undefined} ISO 8601 date string
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
      return new Date(year, month)
    }
    const seconds = new Date().getSeconds()
    const ms = new Date().getMilliseconds()

    return new Date(year, month, day, hour, minute, seconds, ms)
  } catch (error) {
    console.error(error.message.split(':')[0])
  }
}

/**
 * Convert ISO 8601 date to`items` object
 *
 * @param {Date|string} date - ISO 8601 date
 * @returns {object|string} `items` for dateInput component
 */
export function convertIsoDateToObject(date) {
  if (typeof date === 'string') return ''

  if (!date || isNaN(date.valueOf())) return ''

  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1),
    day: String(date.getDate()),
    hour: String(date.getHours()),
    minute: String(date.getMinutes()).padStart(2, '0'),
    seconds: String(date.getSeconds()).padStart(2, '0')
  }
}

/**
 * Add days to a date
 *
 * @param {Date|string} date - Date
 * @param {number} days - Number of days to add
 * @returns {Date} Date with days added
 */
export function addDays(date, days) {
  date = new Date(date.valueOf())
  date.setDate(date.getDate() + days)

  return date
}

/**
 * Remove days from a date
 *
 * @param {Date|string} date - Date
 * @param {number} days - Number of days to remove
 * @returns {Date} Date with days removed
 */
export function removeDays(date, days) {
  date = new Date(date.valueOf())
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
 * @param {Date} date - Date string
 * @param {object} [options] - DateTimeFormat options
 * @returns {string|undefined} Formatted date
 */
export function formatDate(date, options) {
  if (!date || isNaN(date.valueOf())) return

  return new Intl.DateTimeFormat('en-GB', options).format(date)
}

/**
 * Format a data range
 *
 * @param {Date} firstDate - First date string
 * @param {Date} lastDate - Last date string
 * @param {object} [options] - DateTimeFormat options
 * @returns {string|undefined} Formatted date range
 */
export function formatDateRange(firstDate, lastDate, options) {
  if (!firstDate || isNaN(firstDate.valueOf())) return
  if (!lastDate || isNaN(lastDate.valueOf())) return

  return new Intl.DateTimeFormat('en-GB', options).formatRange(
    firstDate,
    lastDate
  )
}

/**
 * Get age from date
 *
 * @param {Date} date - Date
 * @returns {number} Age
 */
export function getAge(date) {
  if (!date || isNaN(date.valueOf())) return 0

  return Math.floor((today().valueOf() - date.getTime()) / 3.15576e10)
}

/**
 * Get difference between two date values
 *
 * @param {Date} a - First date
 * @param {Date} b - Second date
 * @returns {number} School year group
 */
export function getDateValueDifference(a, b) {
  return new Date(a).valueOf() - new Date(b).valueOf()
}

/**
 * Get the academic year a date sits within
 *
 * @param {Date} date - Date
 * @returns {AcademicYear} Academic year a date sits within
 */
export function getAcademicYear(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const startYear = month >= 9 ? year : year - 1

  return AcademicYear[`Y${startYear}`]
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
export function today(secondsToAdd) {
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
 * @param {Date} date - Date
 * @param {AcademicYear} [academicYear] - AcademicYear
 * @returns {number} School year group
 */
export function getYearGroup(date, academicYear) {
  if (!date || isNaN(date.valueOf())) return 0

  // Determine which academic year to use
  let targetYear
  if (academicYear !== undefined) {
    targetYear = Number(academicYear.split(' ')[0])
  } else {
    // Use current academic year
    const currentDate = today()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()

    // If we're before September 1, we're still in the previous academic year
    if (currentMonth < 8) {
      targetYear = currentYear - 1
    } else {
      targetYear = currentYear
    }
  }

  const birthYear = date.getFullYear()
  const birthMonth = date.getMonth()
  const birthDay = date.getDate()

  // Calculate the age of the child on September 1 of the current year
  let ageOnStartOfYear = targetYear - birthYear

  if (birthMonth > 8 || (birthMonth === 8 && birthDay > 1)) {
    // If the birthday is after September 1, subtract 1 from the age
    ageOnStartOfYear -= 1
  }

  // Determine the year group
  return ageOnStartOfYear - 4
}
