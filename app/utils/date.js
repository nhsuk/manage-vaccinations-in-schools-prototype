import { formatISO } from 'date-fns'

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
 * @param {string} input month in words or as a number with or without a leading 0
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
    } else {
      return formatISO(new Date(year, month, day, hour, minute))
    }
  } catch (error) {
    console.error(error.message.split(':')[0])
  }
}

/**
 * Convert ISO 8601 date to`items` object
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
 * @param {string} date - ISO 8601 date
 * @param {number} days - Number of days to add
 * @returns {Date} Date with days added
 */
export function addDays(date, days) {
  date = new Date(date)
  date.setDate(date.getDate() + days)

  return date
}
