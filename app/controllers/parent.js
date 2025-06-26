import wizard from '@x-govuk/govuk-prototype-wizard'

import { generateChild } from '../generators/child.js'
import { generateParent } from '../generators/parent.js'
import { Consent } from '../models/consent.js'
import { ParentalRelationship } from '../models/parent.js'
import { ProgrammeType } from '../models/programme.js'
import { ReplyDecision, ReplyRefusal } from '../models/reply.js'
import { ConsentWindow, Session, SessionType } from '../models/session.js'
import { getHealthQuestionPaths } from '../utils/consent.js'
import { formatList, kebabToCamelCase } from '../utils/string.js'

export const parentController = {
  read(request, response, next, session_id) {
    const session = Session.read(session_id, request.session.data)

    response.locals.assetsName = 'public'
    response.locals.transactionalService = {
      name: 'Give or refuse consent for vaccinations',
      href: session.consentUrl
    }
    response.locals.session = session

    next()
  },

  redirect(request, response) {
    const { session } = response.locals

    response.redirect(
      session.consentWindow === ConsentWindow.Closed
        ? `${session.consentUrl}/closed`
        : `${session.consentUrl}/start`
    )
  },

  show(request, response) {
    const view = request.params.view || 'show'
    const { data } = request.session
    const { session } = response.locals

    // Text and email messages
    if (view === 'emails' || view === 'texts') {
      const child = generateChild()
      const parent = generateParent(child.lastName)

      response.locals.assetsName = 'prototype'

      response.locals.consent = new Consent(
        {
          child,
          parent,
          session_id: session.id
        },
        data
      )

      response.locals.programme = session.primaryProgrammes[0]

      const combinedSideEffects = new Set()
      for (const programme of session.primaryProgrammes) {
        for (const sideEffect of programme.vaccines[0].sideEffects) {
          combinedSideEffects.add(sideEffect)
        }
      }

      response.locals.combinedSideEffects = formatList([...combinedSideEffects])
    }

    response.render(`parent/${view}`)
  },

  new(request, response) {
    const { data } = request.session
    const { session } = response.locals

    const consent = new Consent(
      {
        session_id: session.id
      },
      data
    )

    consent.create(consent, data.wizard)

    response.redirect(`${consent.parentUri}/new/child`)
  },

  update(request, response) {
    const { data } = request.session
    const { consent, paths } = response.locals

    if (consent.consultation) {
      consent.decision = ReplyDecision.Declined
      consent.update(consent, data.wizard)
    }

    // Clean up session data
    delete data.consent

    response.redirect(paths.next)
  },

  readForm(request, response, next) {
    const { session_id, consent_uuid } = request.params
    const { data, referrer } = request.session
    const { __ } = response.locals

    const consent = new Consent(Consent.read(consent_uuid, data?.wizard), data)
    response.locals.consent = consent

    const programmes = consent.session ? consent.session.primaryProgrammes : []
    const hasAlternativeVaccine = programmes[0]?.hasAlternativeVaccines

    // If programme has alternative vaccine, and given consent has been given
    // for the default, ask for consent for the alternative as well
    const getConsentForAlternativeVaccine =
      hasAlternativeVaccine && consent.decision === ReplyDecision.Given

    const journey = {
      [`/${session_id}`]: {},
      [`/${session_id}/${consent_uuid}/new/child`]: {},
      [`/${session_id}/${consent_uuid}/new/dob`]: {},
      ...(consent.session?.type === SessionType.School
        ? { [`/${session_id}/${consent_uuid}/new/confirm-school`]: {} }
        : {}),
      ...(consent.session?.type === SessionType.School &&
      data.confirmSchool !== 'yes'
        ? {
            [`/${session_id}/${consent_uuid}/new/school`]: {}
          }
        : {}),
      [`/${session_id}/${consent_uuid}/new/parent`]: {
        [`/${session_id}/parental-responsibility`]: {
          data: 'consent.parent.hasParentalResponsibility',
          value: 'false'
        },
        [`/${session_id}/${consent_uuid}/new/decision`]: () =>
          !request.session.data.consent?.parent?.tel
      },
      [`/${session_id}/${consent_uuid}/new/contact-preference`]: {},
      [`/${session_id}/${consent_uuid}/new/decision`]: {
        [`/${session_id}/${consent_uuid}/new/refusal-reason`]: {
          data: 'consent.decision',
          value: ReplyDecision.Refused
        }
      },
      [`/${session_id}/${consent_uuid}/new/address`]: {},
      ...getHealthQuestionPaths(`/${session_id}/${consent_uuid}/new/`, consent),
      ...(getConsentForAlternativeVaccine && {
        [`/${session_id}/${consent_uuid}/new/alternative`]: {}
      }),
      [`/${session_id}/${consent_uuid}/new/check-answers`]: {},
      [`/${session_id}/${consent_uuid}/new/confirmation`]: {},
      [`/${session_id}/${consent_uuid}/new/refusal-reason`]: {
        [`/${session_id}/${consent_uuid}/new/refusal-reason-details`]: {
          data: 'consent.refusalReason',
          values: [
            ReplyRefusal.AlreadyGiven,
            ReplyRefusal.GettingElsewhere,
            ReplyRefusal.Medical
          ]
        },
        [`/${session_id}/${consent_uuid}/new/consultation`]: true
      },
      [`/${session_id}/${consent_uuid}/new/refusal-reason-details`]: {
        [`/${session_id}/${consent_uuid}/new/${consent.refusalReason === ReplyRefusal.Medical ? 'consultation' : 'check-answers'}`]: true
      },
      [`/${session_id}/${consent_uuid}/new/consultation`]: {
        [`/${session_id}/${consent_uuid}/new/check-answers`]: true
      },
      [`/${session_id}/${consent_uuid}/new/check-answers`]: {},
      [`/${session_id}/${consent_uuid}/new/confirmation`]: {}
    }

    const paths = wizard(journey, request)
    paths.back = referrer || paths.back
    response.locals.paths = paths

    response.locals.parentalRelationshipItems = Object.values(
      ParentalRelationship
    )
      .filter((relationship) => relationship !== ParentalRelationship.Unknown)
      .map((relationship) => ({
        text: relationship,
        value: relationship,
        ...([
          ParentalRelationship.Fosterer,
          ParentalRelationship.Other
        ].includes(relationship) && { conditional: { html: {} } }) // Added in template
      }))

    if (programmes.length > 1) {
      // MenACWY and Td/IPV: Ask for consent for none, one or all programmes
      response.locals.decisionItems = [
        {
          text: __('consent.decision.both.label'),
          value: ReplyDecision.Given
        },
        {
          text: __('consent.decision.one.label'),
          value: '_one',
          conditional: { html: {} } // Added in template
        },
        {
          divider: 'or'
        },
        {
          text: __('consent.decision.no.label'),
          value: ReplyDecision.Refused
        }
      ]

      response.locals.programmeItems = programmes.map((programme) => ({
        text: programme.name,
        value:
          programme.id === 'td-ipv'
            ? ReplyDecision.OnlyTdIPV
            : ReplyDecision.OnlyMenACWY
      }))
    } else if (hasAlternativeVaccine) {
      // Flu: Ask which vaccine the parent would prefer
      response.locals.decisionItems = [
        {
          text: __('consent.decision.nasal.label'),
          hint: { text: __('consent.decision.nasal.hint') },
          value: ReplyDecision.Given
        },
        {
          text: __('consent.decision.injection.label'),
          hint: { text: __('consent.decision.injection.hint') },
          value: ReplyDecision.OnlyFluInjection
        },
        {
          text: __('consent.decision.no.label'),
          value: ReplyDecision.Refused
        }
      ]
    } else {
      // HPV: Yes or no
      response.locals.decisionItems = [
        {
          text: __('consent.decision.yes.label'),
          value: ReplyDecision.Given
        },
        {
          text: __('consent.decision.no.label'),
          value: ReplyDecision.Refused
        }
      ]
    }

    response.locals.programmeIsFlu = programmes
      .map(({ type }) => type)
      .includes(ProgrammeType.Flu)

    next()
  },

  showForm(request, response) {
    let { view } = request.params
    const { consent } = response.locals

    // Get health question key from view name
    const key = kebabToCamelCase(view.replace('health-question-', ''))

    // All health questions use the same view
    view = view.startsWith('health-question-') ? 'health-question' : view

    // Only ask for details if question does not have sub-questions
    const hasSubQuestions = consent.healthQuestionsForDecision[key]?.conditional

    response.render(`parent/form/${view}`, { key, hasSubQuestions })
  },

  updateForm(request, response) {
    const { decision } = request.body
    const { data } = request.session
    const { paths, consent } = response.locals

    // Flu journey
    if (request.body.consent?.healthAnswers?.asthma?.answer === 'No') {
      delete consent?.healthAnswers?.asthmaSteroids
      delete consent?.healthAnswers?.asthmaAdmitted
    }

    // MenACWY and Td/IPV consent journey
    const combinedDecisionGiven = [
      ReplyDecision.Given,
      ReplyDecision.Refused
    ].includes(request.body.consent?.decision)

    if (!combinedDecisionGiven && decision) {
      request.body.consent.decision = decision
    }

    consent.update(request.body.consent, data.wizard)

    response.redirect(paths.next)
  }
}
