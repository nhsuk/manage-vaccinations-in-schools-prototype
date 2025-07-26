import _ from 'lodash'

import { healthQuestions } from './datasets/health-questions.js'
import {
  Activity,
  ConsentOutcome,
  InstructionOutcome,
  PatientOutcome,
  RegistrationOutcome,
  ScreenOutcome,
  VaccineMethod
} from './enums.js'
import { School } from './models/school.js'
import { User } from './models/user.js'
import { getSessionActivityCount } from './utils/session.js'
import {
  formatHealthAnswer,
  formatLink,
  formatParent,
  camelToKebabCase
} from './utils/string.js'

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
   * Get school form field items
   *
   * @param {object} schools - Schools data
   * @param {string} value - Current value
   * @returns {object} Form field items
   */
  globals.schoolItems = function (schools, value) {
    return [
      {
        value: '',
        text: 'Select a school',
        disabled: true,
        ...(!value && { selected: true })
      },
      ...Object.values(schools)
        .map((school) => new School(school))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((school) => ({
          text: school.name,
          value: school.urn,
          ...(value && { selected: value === school.urn }),
          ...(school.address && {
            attributes: {
              'data-hint': school.address.formatted.singleline
            }
          })
        }))
    ]
  }

  /**
   * Get user form field items
   *
   * @param {object} users - Users data
   * @param {string} value - Current value
   * @returns {object} Form field items
   */
  globals.userItems = function (users, value) {
    return [
      {
        value: '',
        text: 'Select a user',
        disabled: true,
        ...(!value && { selected: true })
      },
      ...Object.values(users)
        .map((user) => new User(user))
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
        .map((user) => ({
          text: user.fullName,
          value: user.uid,
          ...(value && { selected: value === user.uid }),
          ...(user.email && {
            attributes: {
              'data-hint': user.email
            }
          })
        }))
    ]
  }

  /**
   * Get triage outcome form field items
   *
   * @param {Array} outcomes - Screen outcomes
   * @returns {object} Form field items
   */
  globals.triageOutcomeItems = function (outcomes) {
    const { __ } = this.ctx

    return Object.values(outcomes).map((value) =>
      value === 'or'
        ? { divider: 'or' }
        : {
            text: __(`triage.outcome.${value}`),
            value
          }
    )
  }

  /**
   * Inject Nunjucks generated HTML into an object requiring conditional HTML
   *
   * @param {object} object
   * @param {string} value
   * @param {string} html
   * @returns {object} Nunjucks parameters
   */
  globals.injectConditionalHtml = function (object, value, html) {
    const item = object.find((item) => item.value === value)

    if (item) {
      item.conditional = { html }
    }

    return object
  }

  /**
   * Get form field items for a given outcome Enum
   *
   * @param {object} Enum - Enumerable name
   * @param {string} selected - Selected value
   * @returns {object} Form field items
   */
  globals.outcomeItems = function (Enum, selected) {
    return [
      {
        text: 'Any',
        value: 'none',
        checked: !selected || selected === 'none'
      },
      ...Object.values(Enum).map((value) => ({
        text: value,
        value,
        checked: value === selected
      }))
    ]
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
   * @param {string} [parentFacing] - Use parent-facing questions (‘your child’)
   * @returns {Array|undefined} Parameters for summary list component
   */
  globals.healthAnswerRows = function (healthAnswers, edit, parentFacing) {
    if (healthAnswers.length === 0) {
      return
    }

    const summaryRows = []
    for (const [key, healthAnswer] of Object.entries(healthAnswers)) {
      let html = ''

      if (Array.isArray(healthAnswer)) {
        // Answers in multiple replies
        for (const answer of Object.values(healthAnswer)) {
          html += formatHealthAnswer(answer)
        }
      } else {
        // Answer in single reply
        html += formatHealthAnswer(healthAnswer)
      }

      const keyText = parentFacing
        ? healthQuestions[key].label.replace('the child', 'your child')
        : healthQuestions[key].label

      summaryRows.push({
        classes: undefined,
        key: { text: keyText },
        value: { html },
        ...(edit && {
          actions: {
            items: [
              {
                href: edit.replace(`{{key}}`, camelToKebabCase(key)),
                text: 'Change',
                visuallyHiddenText: healthQuestions[key].label
              }
            ]
          }
        })
      })
    }

    summaryRows.at(-1).classes = 'nhsuk-summary-list__row--no-border'

    return summaryRows
  }

  /**
   * Inspect session data
   *
   * @param {object} data - Data to inspect
   * @param {boolean} includeContext - Include context data
   * @returns {string} Inspected data within a `<pre>` element
   */
  globals.inspect = function (data, includeContext = false) {
    const { filters } = this.ctx.settings.nunjucksEnv

    if (!includeContext) {
      const contextlessData = structuredClone(data)
      delete contextlessData.context
      data = contextlessData
    }

    const json = JSON.stringify(data, null, 2)
    return filters.safe(`<pre>${json}</pre>`)
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

  /**
   * Get summaryList `row` parameter for session activity counts
   *
   * @param {string} activity - Data
   * @returns {object} `row`
   */
  globals.sessionActivityRow = function (activity) {
    const { __, __mf, permissions, session } = this.ctx

    const activities = {
      checkGiven: {
        key: 'consent',
        value: ConsentOutcome.Given,
        alwaysShow: true
      },
      checkGivenForInjection: {
        key: 'consent',
        value: ConsentOutcome.GivenForInjection,
        alwaysShow: true
      },
      checkGivenForNasalSpray: {
        key: 'consent',
        value: ConsentOutcome.GivenForNasalSpray,
        alwaysShow: true
      },
      checkRefusal: {
        key: 'consent',
        value: ConsentOutcome.Refused
      },
      getConsent: {
        key: 'consent',
        value: ConsentOutcome.NoResponse,
        action: 'reminders'
      },
      followUp: {
        key: 'consent',
        value: ConsentOutcome.Declined
      },
      resolveConsent: {
        key: 'consent',
        value: ConsentOutcome.Inconsistent
      },
      triage: {
        key: 'screen',
        value: ScreenOutcome.NeedsTriage
      },
      instruct: {
        key: 'instruct',
        value: InstructionOutcome.Needed,
        ...(permissions.canPrescribe && { action: 'instructions' })
      },
      register: {
        key: 'register',
        value: RegistrationOutcome.Pending
      },
      record: {
        key: 'record',
        value: Activity.Record,
        showProgrammes: true
      },
      report: {
        key: 'outcome',
        value: PatientOutcome.Vaccinated,
        alwaysShow: true,
        showProgrammes: true
      },
      reportInjections: {
        key: 'outcome',
        value: PatientOutcome.Vaccinated,
        alwaysShow: true,
        vaccineMethod: VaccineMethod.Injection
      },
      reportNasalSprays: {
        key: 'outcome',
        value: PatientOutcome.Vaccinated,
        alwaysShow: true,
        vaccineMethod: VaccineMethod.Nasal
      }
    }

    const { alwaysShow, key, value, action, showProgrammes, vaccineMethod } =
      activities[activity]

    const links = []
    if (showProgrammes) {
      for (const { nameSentenceCase, id } of session.programmes) {
        const filters = [{ [key]: value }]
        filters.push({ 'programme_id': id })

        const params = new URLSearchParams()
        params.append(key, value)
        params.append('programme_id', id)

        const count = getSessionActivityCount(session, filters)
        const label = __mf(`session.activity.${activity}.programmeCount`, {
          count,
          nameSentenceCase
        })

        if (alwaysShow && count === 0) {
          links.push(label)
        } else if (count > 0) {
          links.push(formatLink(`${session.uri}/${key}?${params}`, label))
        }
      }
    } else {
      const filters = [{ [key]: value }]

      const params = new URLSearchParams()
      params.append(key, value)

      if (vaccineMethod) {
        filters.push({ vaccineMethod })
        params.append('vaccineMethod', vaccineMethod)
      }

      const count = getSessionActivityCount(session, filters)
      const label = __mf(`session.activity.${activity}.count`, { count })

      if (alwaysShow && count === 0) {
        links.push(label)
      } else if (count > 0) {
        links.push(formatLink(`${session.uri}/${key}?${params}`, label))
      }
    }

    return (
      links.length > 0 && {
        key: {
          text: __(`session.activity.${activity}.label`)
        },
        value: {
          html: links.join('<br>')
        },
        ...(action && {
          actions: {
            items: [
              {
                text: __(`session.${action}.label`),
                href: `${session.uri}/${action}`
              }
            ]
          }
        })
      }
    )
  }

  /**
   * Format parent
   *
   * @param {import('./models/parent.js').Parent} parent - Parent
   * @returns {string} Formatted HTML
   */
  globals.parent = function (parent) {
    return formatParent(parent)
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

      if (typeof value !== 'undefined' && value !== 0 && value?.length !== 0) {
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
        const changeText = rows[key].changeText || __(`actions.change`)
        const changeLabel = rows[key].changeLabel || _.lowerFirst(label)
        const href = rows[key].href
        const fallbackValue = href
          ? `<a href="${href}">Add ${changeLabel}</a>`
          : 'Not provided'

        summaryRows.push({
          classes: undefined,
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
                  text: changeText,
                  visuallyHiddenText: changeLabel
                }
              ]
            }
        })
      }
    }

    // Remove border from final row
    summaryRows.at(-1).classes = 'nhsuk-summary-list__row--no-border'

    return summaryRows
  }

  return globals
}
