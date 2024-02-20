import _ from 'lodash'
import { ConsentOutcome, PatientOutcome } from './models/patient.js'
import { ReplyDecision } from './models/reply.js'

/**
 * Prototype specific global functions for use in Nunjucks templates.
 * @returns {object} Globals
 */
export default () => {
  const globals = {}

  /**
   * Get form field items for a given Enum
   * @param {Enum} Enum - Enumerable name
   * @returns {object} Form field items
   */
  globals.enumItems = function (Enum) {
    return Object.entries(Enum).map(([, value]) => ({
      text: value,
      value
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
   * Get status details for a patient
   * @param {import('./models/patient.js').Patient} patient - Patient
   * @returns {object} Patient status
   */
  globals.patientStatus = function (patient) {
    const { __ } = this.ctx

    let colour
    let description = false
    let title

    if (patient.outcome !== PatientOutcome.NoOutcomeYet) {
      // Patient has outcome
      colour = __(`outcome.${patient.outcome}.colour`)
      title = __(`outcome.${patient.outcome}.title`)
    } else if (patient.screen && this.consent === ConsentOutcome.Given) {
      // Patient in triage
      colour = __(`screen.${patient.screen}.colour`)
      description = __(`screen.${patient.screen}.description`)
      title = __(`screen.${patient.screen}.title`)
    } else {
      // Patient requires consent
      colour = __(`consent.${patient.consent}.colour`)
      description = __(`consent.${patient.consent}.description`, patient)
      title = __(`consent.${patient.consent}.title`)
    }

    return { colour, description, title }
  }

  /**
   * Get status details for a reply
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
   * Get HTML to display a previous reply decision as invalid
   * @param {import('./models/reply.js').Reply} reply - Reply
   * @returns {string} HTML string
   */
  globals.replyDecisionHtml = function (reply) {
    if (reply.invalid) {
      return `<s>${reply.decision}</s><br>Invalid`
    }

    return reply.decision
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
      let other = rows[key].other
      let value = rows[key].value || data[key]
      value = other ? [value, other].join(' – ') : value

      // Don’t show row for conditional answer
      if (typeof value === 'undefined') {
        continue
      }

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

    return summaryRows
  }

  return globals
}
