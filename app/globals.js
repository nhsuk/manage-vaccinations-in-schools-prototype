import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import _ from 'lodash'

import exampleUsers from './datasets/users.js'
import { Gender } from './models/child.js'
import {
  ConsentOutcome,
  PatientOutcome,
  ScreenOutcome
} from './models/patient-session.js'
import { User } from './models/user.js'
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
   * Get status details for a patient
   *
   * @param {import('./models/patient-session.js').PatientSession} patientSession - Patient session
   * @returns {object} Patient status
   */
  globals.patientStatus = function (patientSession) {
    const { __, data } = this.ctx
    const { consent, screen, outcome, parentalRelationships, patient } =
      patientSession

    // Get logged in user, else use placeholder
    const user = new User(data.token ? data.token : exampleUsers[0])

    let colour
    let description
    let title

    if (outcome === PatientOutcome.NoOutcomeYet) {
      // If no outcome, use status colour and title for consent/triage outcome

      if (screen === ScreenOutcome.NeedsTriage) {
        // Patient needs triage
        colour = __(`screen.${screen}.colour`)
        description = __(`screen.${screen}.description`, {
          patient,
          user
        })
        title = __(`screen.${screen}.title`)
      } else if (screen === ScreenOutcome.Vaccinate) {
        // Patient needs triage
        colour = __(`screen.${screen}.colour`)
        description = __(`screen.${screen}.description`, {
          patient,
          user
        })
        title = __(`screen.${screen}.title`)
      } else {
        // Patient requires consent
        colour = __(`consent.${consent}.colour`)
        description = __(`consent.${consent}.description`, {
          patient,
          relationships: prototypeFilters.formatList(parentalRelationships)
        })
        title = __(`consent.${consent}.title`)
      }
    } else {
      // If outcome, use status colour and title for that outcome
      colour = __(`outcome.${outcome}.colour`)
      title = __(`outcome.${outcome}.title`)

      // If could not vaccinate, provide a description for why
      if (outcome === PatientOutcome.CouldNotVaccinate) {
        if (
          screen === ScreenOutcome.DelayVaccination ||
          screen === ScreenOutcome.DoNotVaccinate
        ) {
          // Patient had a triage outcome that prevented vaccination
          description = __(`screen.${screen}.description`, {
            patient,
            user
          })
        } else if (
          // Patient wasn’t able to get consent for vaccination
          consent === ConsentOutcome.Inconsistent ||
          consent === ConsentOutcome.Refused
        ) {
          description = __(`consent.${consent}.description`, {
            patient,
            relationships: prototypeFilters.formatList(parentalRelationships)
          })
        }
      }
    }

    return { colour, description, title }
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
   * Show relevant pre-screening questions based on gender of the patient
   *
   * @param {import('./models/session.js').Session} session - Programme
   * @param {import('./models/patient.js').Patient} patient - Patient
   * @returns {Array<string>|undefined} Pre-screening question keys
   */
  globals.preScreenQuestionKeys = function (session, patient) {
    if (!session) {
      return
    }

    return session.preScreenQuestionKeys.filter((value) =>
      patient.gender === Gender.Male ? value !== 'isPregnant' : value
    )
  }

  /**
   * Show reason could not vaccinate
   *
   * @param {import('./models/patient-session.js').PatientSession} patientSession - Patient session
   * @returns {string|undefined} Reason could not vaccinate
   */
  globals.couldNotVaccinateReason = function (patientSession) {
    const { __ } = this.ctx

    if (!patientSession.screen) {
      return __(`consent.${patientSession.consent}.status`)
    } else if (
      patientSession.screen &&
      patientSession.screen !== ScreenOutcome.Vaccinate
    ) {
      return __(`screen.${patientSession.screen}.status`)
    } else if (
      patientSession.screen &&
      patientSession.consent !== ConsentOutcome.Given
    ) {
      return __(`consent.${patientSession.consent}.status`)
    } else if (patientSession.vaccinations.length) {
      return patientSession.vaccinations[0].outcome
    }
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

      if (typeof value !== 'undefined' && value !== 0) {
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
    }

    return summaryRows
  }

  return globals
}
