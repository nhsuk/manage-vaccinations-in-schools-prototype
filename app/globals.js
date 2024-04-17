import _ from 'lodash'
import prototypeFilters from '@x-govuk/govuk-prototype-filters'
import exampleUsers from './datasets/users.js'
import { ConsentOutcome, PatientOutcome } from './models/patient.js'
import { Reply, ReplyDecision } from './models/reply.js'
import { User } from './models/user.js'
import { HealthQuestion } from './models/vaccine.js'
import { getEnumKeyAndValue } from './utils/enum.js'

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

  globals.enumKeyAndValue = getEnumKeyAndValue

  /**
   * Get health answers for summary list rows
   * @param {object} healthAnswers - Health answers
   * @returns {Array|undefined} Parameters for summary list component
   */
  globals.healthAnswerRows = function (healthAnswers) {
    if (healthAnswers.length === 0) {
      return
    }

    const rows = []
    for (let [id, value] of Object.entries(healthAnswers)) {
      let html = ''
      if (typeof value === 'object') {
        // Answers across all replies
        // Show the relationship of person of answered, as well as their answer
        for (let [relationship, answer] of Object.entries(value)) {
          html += answer
            ? `<p>${relationship} responded: Yes:</p>\n<blockquote>${answer}</blockquote>`
            : `<p>${relationship} responded: No<p>`
        }
      } else {
        // Answer in reply
        // Only show the answer
        html += value
          ? `<p>Yes:</p>\n<blockquote>${prototypeFilters.govukMarkdown(value).replaceAll('govuk-', 'nhsuk-')}</blockquote>`
          : `<p>No<p>`
      }

      rows.push({
        key: { text: HealthQuestion[id] },
        value: { html }
      })
    }

    return rows
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
    const { __, data } = this.ctx

    // Get logged in user, else use placeholder
    const user = new User(data.token ? data.token : exampleUsers[0])

    // Get replies
    const replies = Object.values(patient.replies)
      .map((reply) => new Reply(reply))
      .filter((reply) => !reply.invalid)

    let colour
    let description = false
    let relationships = []
    let title

    // Build list of reply relationships
    for (let reply of replies) {
      relationships.push(reply.relationship)
    }

    if (patient.outcome !== PatientOutcome.NoOutcomeYet) {
      // Patient has outcome
      colour = __(`outcome.${patient.outcome}.colour`)
      title = __(`outcome.${patient.outcome}.title`)
    } else if (
      patient.screen &&
      patient.consent.value === ConsentOutcome.Given
    ) {
      // Patient in triage
      colour = __(`screen.${patient.screen.key}.colour`)
      description = __(`screen.${patient.screen.key}.description`, {
        patient,
        user
      })
      title = __(`screen.${patient.screen.key}.title`)
    } else {
      // Patient requires consent
      colour = __(`consent.${patient.consent.key}.colour`)
      description = __(`consent.${patient.consent.key}.description`, {
        patient,
        relationships: prototypeFilters.formatList(relationships)
      })
      title = __(`consent.${patient.consent.key}.title`)
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
