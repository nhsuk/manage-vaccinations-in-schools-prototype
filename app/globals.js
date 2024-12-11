import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import _ from 'lodash'

import exampleUsers from './datasets/users.js'
import { Gender } from './models/child.js'
import {
  ConsentOutcome,
  PatientOutcome,
  ScreenOutcome
} from './models/patient.js'
import { Reply, ReplyDecision } from './models/reply.js'
import { User } from './models/user.js'
import { Vaccination } from './models/vaccination.js'
import { HealthQuestion } from './models/vaccine.js'
import { getEnumKeyAndValue } from './utils/enum.js'
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

  globals.enumKeyAndValue = getEnumKeyAndValue

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
   * @param {import('./models/patient.js').Patient} patient - Patient
   * @returns {object} Patient status
   */
  globals.patientStatus = function (patient) {
    const { __, data } = this.ctx
    const { consent, screen, outcome } = patient

    // Get logged in user, else use placeholder
    const user = new User(data.token ? data.token : exampleUsers[0])

    // Get replies
    const replies = Object.values(patient.replies)
      .map((reply) => new Reply(reply))
      .filter((reply) => !reply.invalid)

    let colour
    let description = false
    const relationships = []
    let title

    // Build list of reply relationships
    for (const reply of replies) {
      relationships.push(reply.relationship || 'Parent or guardian')
    }

    if (outcome.value === PatientOutcome.NoOutcomeYet) {
      // If no outcome, use status colour and title for consent/triage outcome

      if (screen.value === ScreenOutcome.NeedsTriage) {
        // Patient needs triage
        colour = __(`screen.${screen.key}.colour`)
        description = __(`screen.${screen.key}.description`, {
          patient,
          user
        })
        title = __(`screen.${screen.key}.title`)
      } else if (screen.value === ScreenOutcome.Vaccinate) {
        // Patient needs triage
        colour = __(`screen.${screen.key}.colour`)
        description = __(`screen.${screen.key}.description`, {
          patient,
          user
        })
        title = __(`screen.${screen.key}.title`)
      } else {
        // Patient requires consent
        colour = __(`consent.${consent.key}.colour`)
        description = __(`consent.${consent.key}.description`, {
          patient,
          relationships: prototypeFilters.formatList(relationships)
        })
        title = __(`consent.${consent.key}.title`)
      }
    } else {
      // If outcome, use status colour and title for that outcome
      colour = __(`outcome.${outcome.key}.colour`)
      title = __(`outcome.${outcome.key}.title`)

      // If could not vaccinate, provide a description for why
      if (outcome.value === PatientOutcome.CouldNotVaccinate) {
        if (
          screen.value === ScreenOutcome.DelayVaccination ||
          screen.value === ScreenOutcome.DoNotVaccinate
        ) {
          // Patient had a triage outcome that prevented vaccination
          description = __(`screen.${screen.key}.description`, {
            patient,
            user
          })
        } else if (
          // Patient wasn’t able to get consent for vaccination
          consent.value === ConsentOutcome.Inconsistent ||
          consent.value === ConsentOutcome.Refused
        ) {
          description = __(`consent.${consent.key}.description`, {
            patient,
            relationships: prototypeFilters.formatList(relationships)
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
   * Get status details for a reply
   *
   * @param {import('./models/reply.js').Reply} reply - Reply
   * @returns {object} Reply status
   */
  globals.replyStatus = function (reply) {
    const { __ } = this.ctx
    const { key } = getEnumKeyAndValue(ReplyDecision, reply.decision)

    return {
      colour: __(`reply.${key}.colour`)
    }
  }

  /**
   * Show relevant pre-screening questions based on gender of the patient
   *
   * @param {import('./models/programme.js').Programme} programme - Programme
   * @param {import('./models/patient.js').Patient} patient - Patient
   * @returns {Array<string>|undefined} Pre-screening question keys
   */
  globals.preScreenQuestionKeys = function (programme, patient) {
    if (!programme) {
      return
    }

    const { preScreenQuestionKeys } = programme.vaccine
    return preScreenQuestionKeys.filter((value) =>
      patient.gender === Gender.Male ? value !== 'isPregnant' : value
    )
  }

  /**
   * Show reason could not vaccinate
   *
   * @param {import('./models/patient.js').Patient} patient - Patient
   * @returns {string|undefined} Reason could not vaccinate
   */
  globals.couldNotVaccinateReason = function (patient) {
    const { __, data } = this.ctx

    if (
      patient?.screen?.value &&
      patient?.screen?.value !== ScreenOutcome.Vaccinate
    ) {
      return __(`screen.${patient.screen.key}.status`)
    } else if (patient?.consent?.value !== ConsentOutcome.Given) {
      return __(`consent.${patient.consent.key}.status`)
    } else if (patient.vaccinations) {
      const vaccinations = Object.keys(patient.vaccinations).map(
        (uuid) => new Vaccination(data.vaccinations[uuid])
      )
      return vaccinations[0].outcome
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
