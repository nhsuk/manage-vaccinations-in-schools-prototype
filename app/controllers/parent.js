import wizard from '@x-govuk/govuk-prototype-wizard'

import { generateChild } from '../generators/child.js'
import { generateParent } from '../generators/parent.js'
import { Consent } from '../models/consent.js'
import { ProgrammeType } from '../models/programme.js'
import { ReplyDecision, ReplyRefusal } from '../models/reply.js'
import { School } from '../models/school.js'
import { ConsentWindow, Session, SessionType } from '../models/session.js'
import { HealthQuestion } from '../models/vaccine.js'
import { getHealthQuestionPaths } from '../utils/consent.js'
import { formatList, kebabToPascalCase } from '../utils/string.js'

export const parentController = {
  read(request, response, next, session_id) {
    const session = Session.read(session_id, request.session.data)

    response.locals.transactionalService = {
      name: 'Give or refuse consent for vaccinations',
      href: session.consentUrl
    }
    response.locals.public = true
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

      response.locals.consent = new Consent(
        {
          child,
          parent,
          session_id: session.id
        },
        data
      )

      response.locals.programme = session.programmes[0]

      const combinedSideEffects = new Set()
      for (const programme of session.programmes) {
        for (const sideEffect of programme.vaccine.sideEffects) {
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

    consent.update(request.body.consent, data)

    // Clean up session data
    delete data.consent

    response.redirect(paths.next)
  },

  readForm(request, response, next) {
    const { session_id, consent_uuid } = request.params
    const { data, referrer } = request.session

    const consent = new Consent(Consent.read(consent_uuid, data?.wizard), data)
    response.locals.consent = consent

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
        [`/${session_id}/${consent_uuid}/new/decision`]: () =>
          !request.session.data.consent?.parent?.tel
      },
      [`/${session_id}/${consent_uuid}/new/contact-preference`]: {},
      [`/${session_id}/${consent_uuid}/new/decision`]: {
        [`/${session_id}/${consent_uuid}/new/consultation`]: {
          data: 'consent.decision',
          value: ReplyDecision.Refused
        }
      },
      [`/${session_id}/${consent_uuid}/new/address`]: {},
      ...getHealthQuestionPaths(
        `/${session_id}/${consent_uuid}/new/`,
        consent.session,
        consent.decision
      ),
      [`/${session_id}/${consent_uuid}/new/check-answers`]: {},
      [`/${session_id}/${consent_uuid}/new/confirmation`]: {},
      [`/${session_id}/${consent_uuid}/new/consultation`]: {
        [`/${session_id}/${consent_uuid}/new/refusal-reason`]: {
          data: 'consent.decision',
          value: ReplyDecision.Refused
        }
      },
      [`/${session_id}/${consent_uuid}/new/refusal-reason`]: {
        [`/${session_id}/${consent_uuid}/new/refusal-reason-details`]: {
          data: 'consent.refusalReason',
          values: [
            ReplyRefusal.AlreadyGiven,
            ReplyRefusal.GettingElsewhere,
            ReplyRefusal.Medical
          ]
        },
        [`/${session_id}/${consent_uuid}/new/check-answers`]: true
      },
      [`/${session_id}/${consent_uuid}/new/refusal-reason-details`]: {
        [`/${session_id}/${consent_uuid}/new/check-answers`]: true
      },
      [`/${session_id}/${consent_uuid}/new/check-answers`]: {},
      [`/${session_id}/${consent_uuid}/new/confirmation`]: {}
    }

    const paths = wizard(journey, request)
    paths.back = referrer || paths.back
    response.locals.paths = paths

    response.locals.programmeIsFlu = consent.session.programmes
      .map(({ type }) => type)
      .includes(ProgrammeType.Flu)

    response.locals.programmeItems = consent.session.programmes.map(
      (programme) => ({
        text: programme.name,
        value:
          programme.id === 'td-ipv'
            ? ReplyDecision.OnlyTdIPV
            : ReplyDecision.OnlyMenACWY
      })
    )

    response.locals.urnItems = Object.values(data.schools)
      .map((school) => new School(school))
      .map((school) => ({
        text: school.name,
        value: school.urn,
        ...(school.address && {
          attributes: {
            'data-hint': school.address.formatted.singleline
          }
        })
      }))

    next()
  },

  showForm(request, response) {
    let { view } = request.params

    // Get health question key from view name
    const key = kebabToPascalCase(view.replace('health-question-', ''))
    const healthQuestion = HealthQuestion[key]?.replace(
      'the child',
      'your child'
    )

    // All health questions use the same view
    view = view.startsWith('health-question-') ? 'health-question' : view

    response.render(`parent/form/${view}`, { key, healthQuestion })
  },

  updateForm(request, response) {
    const { decision } = request.body
    const { data } = request.session
    const { paths, consent } = response.locals

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
